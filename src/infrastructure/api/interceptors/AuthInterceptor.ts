import { RequestInterceptor, RequestConfig } from '../ApiClient';
import { supabase } from '../../../lib/supabase';

export class AuthInterceptor implements RequestInterceptor {
  onRequest = async (config: RequestConfig): Promise<RequestConfig> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      return {
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${session.access_token}`,
        },
      };
    }

    return config;
  };

  onError = async (error: Error): Promise<void> => {
    console.error('[Auth Interceptor Error]', error);
  };
}
