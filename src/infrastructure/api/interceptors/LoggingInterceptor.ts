import { RequestInterceptor, ResponseInterceptor, RequestConfig, ApiClientError } from '../ApiClient';

export class LoggingInterceptor implements RequestInterceptor, ResponseInterceptor {
  private isDevelopment = import.meta.env.DEV;

  onRequest = (config: RequestConfig): RequestConfig => {
    if (this.isDevelopment) {
      console.log('[API Request]', {
        timestamp: new Date().toISOString(),
        config,
      });
    }
    return config;
  };

  onSuccess = <T>(data: T): T => {
    if (this.isDevelopment) {
      console.log('[API Success]', {
        timestamp: new Date().toISOString(),
        data,
      });
    }
    return data;
  };

  onError = async (error: ApiClientError): Promise<void> => {
    console.error('[API Error]', {
      timestamp: new Date().toISOString(),
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
    });
  };
}
