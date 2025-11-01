import { supabase } from '../../lib/supabase';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onError?: (error: Error) => void | Promise<void>;
}

export interface ResponseInterceptor {
  onSuccess?: <T>(data: T) => T | Promise<T>;
  onError?: (error: ApiClientError) => void | Promise<void>;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  retries?: number;
  timeout?: number;
  metadata?: Record<string, unknown>;
}

export class ApiClient {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private defaultConfig: RequestConfig = {
    retries: 3,
    timeout: 30000,
  };

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = { ...this.defaultConfig, ...config };

    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        try {
          processedConfig = await interceptor.onRequest(processedConfig);
        } catch (error) {
          if (interceptor.onError) {
            await interceptor.onError(error as Error);
          }
          throw error;
        }
      }
    }

    return processedConfig;
  }

  private async applyResponseInterceptors<T>(data: T): Promise<T> {
    let processedData = data;

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onSuccess) {
        processedData = await interceptor.onSuccess(processedData);
      }
    }

    return processedData;
  }

  private async handleError(error: unknown): Promise<never> {
    const apiError = this.normalizeError(error);

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onError) {
        await interceptor.onError(apiError);
      }
    }

    throw apiError;
  }

  private normalizeError(error: unknown): ApiClientError {
    if (error instanceof ApiClientError) {
      return error;
    }

    if (error instanceof Error) {
      return new ApiClientError(error.message);
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      return new ApiClientError(
        (err.message as string) || 'An unknown error occurred',
        err.code as string,
        err.status as number,
        err.details
      );
    }

    return new ApiClientError('An unknown error occurred');
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config?: RequestConfig
  ): Promise<T> {
    const processedConfig = await this.applyRequestInterceptors(config || {});
    const maxRetries = processedConfig.retries || 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return await this.applyResponseInterceptors(result);
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          break;
        }

        if (!this.isRetryableError(error)) {
          break;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return this.handleError(lastError);
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof ApiClientError) {
      return error.status ? error.status >= 500 : false;
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      return (err.message as string)?.includes('network') || 
             (err.message as string)?.includes('timeout') ||
             err.code === 'ECONNREFUSED';
    }

    return false;
  }

  getSupabaseClient() {
    return supabase;
  }
}

export const apiClient = new ApiClient();
