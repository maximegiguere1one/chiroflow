import { logger } from './Logger';

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
}

export type ErrorHandler = (error: ErrorReport) => void;

export class ErrorTracker {
  private errors: ErrorReport[] = [];
  private handlers: ErrorHandler[] = [];
  private maxErrors: number = 100;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        type: 'window.error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandledrejection',
        promise: 'Promise rejection',
      });
    });
  }

  captureError(
    error: Error | string,
    context?: Record<string, any>,
    severity: ErrorReport['severity'] = 'medium'
  ): string {
    const errorReport: ErrorReport = {
      id: this.generateId(),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      timestamp: Date.now(),
      severity,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    this.errors.push(errorReport);

    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    logger.error('Error captured', error as Error, context);

    for (const handler of this.handlers) {
      try {
        handler(errorReport);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    }

    return errorReport.id;
  }

  onError(handler: ErrorHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  getErrors(filter?: {
    severity?: ErrorReport['severity'];
    since?: number;
  }): ErrorReport[] {
    let filtered = [...this.errors];

    if (filter?.severity) {
      filtered = filtered.filter((e) => e.severity === filter.severity);
    }

    if (filter?.since) {
      filtered = filtered.filter((e) => e.timestamp >= filter.since);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  getErrorById(id: string): ErrorReport | undefined {
    return this.errors.find((e) => e.id === id);
  }

  getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    last24h: number;
  } {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let last24h = 0;

    for (const error of this.errors) {
      bySeverity[error.severity]++;
      if (error.timestamp >= oneDayAgo) {
        last24h++;
      }
    }

    return {
      total: this.errors.length,
      bySeverity,
      last24h,
    };
  }

  clearErrors(): void {
    this.errors = [];
    logger.info('Error tracker cleared');
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const errorTracker = new ErrorTracker();
