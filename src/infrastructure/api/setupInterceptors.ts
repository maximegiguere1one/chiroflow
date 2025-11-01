import { apiClient } from './ApiClient';
import { LoggingInterceptor } from './interceptors/LoggingInterceptor';
import { AuthInterceptor } from './interceptors/AuthInterceptor';
import { PerformanceInterceptor } from './interceptors/PerformanceInterceptor';

export function setupApiInterceptors(): void {
  apiClient.addRequestInterceptor(new AuthInterceptor());
  apiClient.addRequestInterceptor(new LoggingInterceptor());
  apiClient.addRequestInterceptor(new PerformanceInterceptor());

  apiClient.addResponseInterceptor(new LoggingInterceptor());
  apiClient.addResponseInterceptor(new PerformanceInterceptor());
}
