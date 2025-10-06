const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

// Request queue for deduplication
const pendingRequests = new Map<string, Promise<any>>();

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

// API Error class with detailed info
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

// Network error detection
function isNetworkError(error: any): boolean {
  return error instanceof TypeError && error.message === 'Failed to fetch';
}

// Sleep utility for retries
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Merge headers helper
function mergeHeaders(init: RequestInit, isFormData: boolean): HeadersInit {
  const base = new Headers(init.headers as HeadersInit);
  if (!isFormData && !base.has('Content-Type')) {
    base.set('Content-Type', 'application/json');
  }
  return base;
}

// Request deduplication key generator
function getRequestKey(input: string, init: RequestInit): string {
  const method = init.method || 'GET';
  const body = init.body instanceof FormData ? 'FORMDATA' : init.body?.toString() || '';
  return `${method}:${input}:${body}`;
}

// Main API request with retry, deduplication, timeout
export async function apiRequest<T>(
  input: string,
  init: RequestInit = {},
  options: {
    retry?: Partial<RetryConfig>;
    deduplicate?: boolean;
    timeout?: number;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<T> {
  const {
    retry = {},
    deduplicate = true,
    timeout = 30000,
    onProgress
  } = options;

  const retryConfig = { ...defaultRetryConfig, ...retry };
  const isFormData = init.body instanceof FormData;

  // Deduplication for GET requests
  if (deduplicate && (init.method === 'GET' || !init.method)) {
    const key = getRequestKey(input, init);
    const pending = pendingRequests.get(key);
    if (pending) {
      return pending;
    }
  }

  const executeRequest = async (attemptNumber = 0): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${API_URL}${input}`, {
        ...init,
        headers: mergeHeaders(init, isFormData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle progress for large uploads
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

        // Retry on retryable status codes
        if (
          retryConfig.retryableStatuses.includes(response.status) &&
          attemptNumber < retryConfig.maxRetries
        ) {
          const delay = retryConfig.retryDelay * Math.pow(2, attemptNumber);
          await sleep(delay);
          return executeRequest(attemptNumber + 1);
        }

        throw error;
      }

      // Success response
      if (response.status === 204) {
        return undefined as T;
      }
      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry on network errors
      if (isNetworkError(error) && attemptNumber < retryConfig.maxRetries) {
        const delay = retryConfig.retryDelay * Math.pow(2, attemptNumber);
        await sleep(delay);
        return executeRequest(attemptNumber + 1);
      }

      // Timeout error
      if ((error as Error).name === 'AbortError') {
        throw new ApiError(408, 'Request Timeout', 'The request took too long to complete');
      }

      throw error;
    }
  };

  const requestPromise = executeRequest();

  // Cache promise for deduplication
  if (deduplicate && (init.method === 'GET' || !init.method)) {
    const key = getRequestKey(input, init);
    pendingRequests.set(key, requestPromise);
    requestPromise.finally(() => pendingRequests.delete(key));
  }

  return requestPromise;
}

export { API_URL };
