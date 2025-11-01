import { RequestInterceptor, ResponseInterceptor, RequestConfig, ApiClientError } from '../ApiClient';

export class PerformanceInterceptor implements RequestInterceptor, ResponseInterceptor {
  private requestTimestamps = new Map<string, number>();

  onRequest = (config: RequestConfig): RequestConfig => {
    const requestId = this.generateRequestId();
    const now = Date.now();
    this.requestTimestamps.set(requestId, now);

    return {
      ...config,
      metadata: {
        ...config.metadata,
        requestId,
      },
    };
  };

  onSuccess = <T>(data: T): T => {
    this.logPerformance(data);
    return data;
  };

  onError = async (error: ApiClientError): Promise<void> => {
    this.logPerformance(error);
  };

  private logPerformance(result: unknown): void {
    if (typeof result === 'object' && result !== null) {
      const metadata = (result as Record<string, unknown>).metadata as Record<string, unknown>;
      if (metadata?.requestId) {
        const requestId = metadata.requestId as string;
        const startTime = this.requestTimestamps.get(requestId);
        
        if (startTime) {
          const now = Date.now();
          const duration = now - startTime;
          console.log(`[Performance] Request ${requestId} took ${duration}ms`);
          this.requestTimestamps.delete(requestId);
        }
      }
    }
  }

  private generateRequestId(): string {
    const now = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${now}-${random}`;
  }
}
