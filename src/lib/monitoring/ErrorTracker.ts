import { supabase } from '../supabase';

export interface ErrorLog {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  organizationId?: string;
}

export class ErrorTracker {
  private static errorQueue: ErrorLog[] = [];
  private static flushInterval: NodeJS.Timeout | null = null;

  static init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureError({
          message: event.message,
          stack: event.error?.stack,
          severity: 'error',
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.captureError({
          message: `Unhandled Promise Rejection: ${event.reason}`,
          stack: event.reason?.stack,
          severity: 'error',
        });
      });

      this.flushInterval = setInterval(() => {
        this.flush();
      }, 30000);
    }
  }

  static captureError(error: ErrorLog) {
    console.error('[ErrorTracker]', error);

    this.errorQueue.push({
      ...error,
      context: {
        ...error.context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    });

    if (this.errorQueue.length >= 10) {
      this.flush();
    }
  }

  static async flush() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      for (const error of errors) {
        await supabase.from('error_analytics').insert({
          error_type: error.severity,
          error_message: error.message,
          stack_trace: error.stack,
          context: error.context,
          user_id: error.userId,
          organization_id: error.organizationId,
        });
      }
    } catch (err) {
      console.error('Failed to flush error logs:', err);
      this.errorQueue.unshift(...errors);
    }
  }

  static captureException(error: Error, context?: Record<string, any>) {
    this.captureError({
      message: error.message,
      stack: error.stack,
      severity: 'error',
      context,
    });
  }

  static captureMessage(message: string, severity: ErrorLog['severity'] = 'info', context?: Record<string, any>) {
    this.captureError({
      message,
      severity,
      context,
    });
  }

  static async getRecentErrors(organizationId?: string, limit: number = 50) {
    let query = supabase
      .from('error_analytics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}
