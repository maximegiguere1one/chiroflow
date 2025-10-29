import { AppError, ERROR_CODES } from './errorHandler';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: (error: unknown, attempt: number) => {
    if (attempt >= 3) return false;

    if (error instanceof AppError) {
      const retryableCodes = [
        ERROR_CODES.NETWORK_ERROR,
        ERROR_CODES.NETWORK_TIMEOUT,
        ERROR_CODES.DATABASE_CONNECTION_FAILED,
      ];
      return retryableCodes.includes(error.code as any);
    }

    if (error instanceof Error) {
      return error.message.toLowerCase().includes('network') ||
             error.message.toLowerCase().includes('timeout') ||
             error.message.toLowerCase().includes('fetch');
    }

    return false;
  },
  onRetry: (attempt: number) => {
    console.log(`Retry attempt ${attempt}...`);
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === opts.maxAttempts || !opts.shouldRetry(error, attempt)) {
        throw error;
      }

      opts.onRetry(attempt, error);

      const delay = opts.delayMs * Math.pow(opts.backoffMultiplier, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(timeoutError || new AppError(
        `Operation timed out after ${timeoutMs}ms`,
        ERROR_CODES.NETWORK_TIMEOUT,
        'medium'
      ));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

export async function batchWithRetry<T>(
  items: T[],
  processFn: (item: T) => Promise<void>,
  options: {
    batchSize?: number;
    delayBetweenBatches?: number;
    retryOptions?: RetryOptions;
  } = {}
): Promise<{ successful: T[]; failed: Array<{ item: T; error: unknown }> }> {
  const {
    batchSize = 10,
    delayBetweenBatches = 100,
    retryOptions = {},
  } = options;

  const successful: T[] = [];
  const failed: Array<{ item: T; error: unknown }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (item) => {
        try {
          await withRetry(() => processFn(item), retryOptions);
          successful.push(item);
        } catch (error) {
          failed.push({ item, error });
        }
      })
    );

    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return { successful, failed };
}

export class RateLimiter {
  private queue: Array<() => void> = [];
  private activeRequests = 0;

  constructor(
    private maxConcurrent: number,
    private minDelayMs: number = 0
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    while (this.activeRequests >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }

    this.activeRequests++;

    try {
      const result = await fn();

      if (this.minDelayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, this.minDelayMs));
      }

      return result;
    } finally {
      this.activeRequests--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

export const emailRateLimiter = new RateLimiter(5, 200);
export const apiRateLimiter = new RateLimiter(10, 100);
