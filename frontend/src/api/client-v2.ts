import { circuitBreakers } from '../utils/circuitBreaker';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

// Request queue for deduplication
const pendingRequests = new Map<string, Promise<any>>();

// Rate limiting with token bucket algorithm
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function checkRateLimit(endpoint: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  let bucket = rateLimitBuckets.get(endpoint);

  if (!bucket) {
    bucket = { tokens: maxRequests, lastRefill: now };
    rateLimitBuckets.set(endpoint, bucket);
  }

  // Refill tokens based on time passed
  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor((timePassed / windowMs) * maxRequests);
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(maxRequests, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // Consume token if available
  if (bucket.tokens > 0) {
    bucket.tokens--;
    return true;
  }

  return false;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses: number[];
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

// API Error class
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

// Utilities
const isNetworkError = (error: any): boolean =>
  error instanceof TypeError && error.message === 'Failed to fetch';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function mergeHeaders(init: RequestInit, isFormData: boolean): HeadersInit {
  const base = new Headers(init.headers as HeadersInit);
  if (!isFormData && !base.has('Content-Type')) {
    base.set('Content-Type', 'application/json');
  }
  return base;
}

function getRequestKey(input: string, init: RequestInit): string {
  const method = init.method || 'GET';
  const body = init.body instanceof FormData ? 'FORMDATA' : init.body?.toString() || '';
  return `${method}:${input}:${body}`;
}

// Main API request function
export async function apiRequest<T>(
  input: string,
  init: RequestInit = {},
  options: {
    retry?: Partial<RetryConfig>;
    deduplicate?: boolean;
    timeout?: number;
    onProgress?: (progress: number) => void;
    circuitBreaker?: 'translation' | 'quickTranslate' | 'auth' | 'payment';
    rateLimit?: { maxRequests: number; windowMs: number };
  } = {}
): Promise<T> {
  const {
    retry = {},
    deduplicate = true,
    timeout = 30000,
    onProgress,
    circuitBreaker: cbName,
    rateLimit
  } = options;

  // Rate limit check
  if (rateLimit && !checkRateLimit(input, rateLimit.maxRequests, rateLimit.windowMs)) {
    throw new ApiError(429, 'Too Many Requests', 'Rate limit exceeded. Please slow down.');
  }

  const retryConfig = { ...defaultRetryConfig, ...retry };
  const isFormData = init.body instanceof FormData;

  // Core request logic
  const performRequest = async (attemptNumber = 0): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${API_URL}${input}`, {
        ...init,
        headers: mergeHeaders(init, isFormData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Progress tracking
      if (onProgress && response.body) {
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          const total = parseInt(contentLength, 10);
          let loaded = 0;
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            loaded += value.length;
            chunks.push(value);
            onProgress((loaded / total) * 100);
          }

          const blob = new Blob(chunks);
          const text = await blob.text();
          if (!response.ok) {
            throw new ApiError(response.status, response.statusText, text);
          }
          return response.status === 204 ? (undefined as T) : (JSON.parse(text) as T);
        }
      }

      // Error handling
      if (!response.ok) {
        const text = await response.text();
        const error = new ApiError(response.status, response.statusText, text);

        // Retry logic
        if (
          retryConfig.retryableStatuses.includes(response.status) &&
          attemptNumber < retryConfig.maxRetries
        ) {
          const delay = retryConfig.retryDelay * Math.pow(2, attemptNumber);
          await sleep(delay);
          return performRequest(attemptNumber + 1);
        }

        throw error;
      }

      // Success
      return response.status === 204 ? (undefined as T) : (await response.json() as T);
    } catch (error) {
      clearTimeout(timeoutId);

      // Network error retry
      if (isNetworkError(error) && attemptNumber < retryConfig.maxRetries) {
        const delay = retryConfig.retryDelay * Math.pow(2, attemptNumber);
        await sleep(delay);
        return performRequest(attemptNumber + 1);
      }

      // Timeout error
      if ((error as Error).name === 'AbortError') {
        throw new ApiError(408, 'Request Timeout', 'The request took too long');
      }

      throw error;
    }
  };

  // Wrap with circuit breaker if specified
  const wrappedRequest = async (): Promise<T> => {
    if (cbName && circuitBreakers[cbName]) {
      return circuitBreakers[cbName].execute(() => performRequest());
    }
    return performRequest();
  };

  // Deduplication
  if (deduplicate && (init.method === 'GET' || !init.method)) {
    const key = getRequestKey(input, init);
    const pending = pendingRequests.get(key);
    if (pending) return pending;

    const promise = wrappedRequest();
    pendingRequests.set(key, promise);
    promise.finally(() => pendingRequests.delete(key));
    return promise;
  }

  return wrappedRequest();
}

export { API_URL };
