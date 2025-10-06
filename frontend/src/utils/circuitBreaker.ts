/**
 * Circuit Breaker Pattern for API Resilience
 *
 * Prevents cascading failures by stopping requests to failing services
 * States: CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing recovery)
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Too many failures, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

interface CircuitBreakerOptions {
  failureThreshold: number;  // Number of failures before opening
  successThreshold: number;  // Number of successes to close from half-open
  timeout: number;           // Time in ms before attempting half-open
  resetTimeout?: number;     // Time to reset failure count in closed state
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt: number = Date.now();
  private lastFailureTime: number = 0;

  constructor(
    private name: string,
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      resetTimeout: 120000 // 2 minutes
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(
          `Circuit breaker is OPEN for ${this.name}. Service temporarily unavailable.`
        );
      }
      // Try half-open
      this.state = CircuitState.HALF_OPEN;
      console.log(`Circuit breaker ${this.name}: HALF_OPEN - testing recovery`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log(`Circuit breaker ${this.name}: CLOSED - service recovered`);
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      this.nextAttempt = Date.now() + this.options.timeout;
      console.error(`Circuit breaker ${this.name}: OPEN - service still failing`);
    }

    if (
      this.state === CircuitState.CLOSED &&
      this.failureCount >= this.options.failureThreshold
    ) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.timeout;
      console.error(
        `Circuit breaker ${this.name}: OPEN - too many failures (${this.failureCount})`
      );
    }

    // Reset failure count if enough time passed
    if (
      this.options.resetTimeout &&
      Date.now() - this.lastFailureTime > this.options.resetTimeout
    ) {
      this.failureCount = 0;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === CircuitState.OPEN ? new Date(this.nextAttempt) : null
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    console.log(`Circuit breaker ${this.name}: manually reset`);
  }
}

// Global circuit breakers for different services
export const circuitBreakers = {
  translation: new CircuitBreaker('translation-api', {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000, // 30 seconds
    resetTimeout: 60000 // 1 minute
  }),

  quickTranslate: new CircuitBreaker('quick-translate-api', {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    resetTimeout: 120000 // 2 minutes
  }),

  auth: new CircuitBreaker('auth-api', {
    failureThreshold: 3,
    successThreshold: 1,
    timeout: 15000, // 15 seconds (faster recovery for auth)
    resetTimeout: 30000 // 30 seconds
  }),

  payment: new CircuitBreaker('payment-api', {
    failureThreshold: 2, // More strict for payments
    successThreshold: 3, // More checks before closing
    timeout: 120000, // 2 minutes
    resetTimeout: 300000 // 5 minutes
  })
};

// Health check monitoring
export function monitorCircuitBreakers() {
  const stats = Object.entries(circuitBreakers).map(([name, breaker]) => ({
    service: name,
    ...breaker.getStats()
  }));

  const openCircuits = stats.filter(s => s.state === CircuitState.OPEN);
  if (openCircuits.length > 0) {
    console.warn('⚠️ Open circuit breakers:', openCircuits);
  }

  return stats;
}

// Auto-monitor every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(monitorCircuitBreakers, 30000);
}
