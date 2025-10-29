interface ErrorLog {
  id: string;
  timestamp: Date;
  errorCode: string;
  message: string;
  stack?: string;
  userId?: string;
  context?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLogs: ErrorLog[] = [];
  private maxLogs = 100;

  private constructor() {
    this.setupGlobalHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.logError({
        errorCode: 'GLOBAL_ERROR',
        message: event.message,
        stack: event.error?.stack,
        severity: 'high',
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        errorCode: 'UNHANDLED_PROMISE',
        message: event.reason?.message || 'Promise rejection',
        stack: event.reason?.stack,
        severity: 'high',
      });
    });
  }

  logError(params: Omit<ErrorLog, 'id' | 'timestamp'>): string {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...params,
    };

    this.errorLogs.push(errorLog);

    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs.shift();
    }

    if (import.meta.env.DEV) {
      console.error(`[${errorLog.severity.toUpperCase()}] ${errorLog.errorCode}:`, {
        message: errorLog.message,
        context: errorLog.context,
        stack: errorLog.stack,
      });
    }

    if (errorLog.severity === 'critical') {
      this.sendToMonitoring(errorLog);
    }

    return errorLog.id;
  }

  private async sendToMonitoring(error: ErrorLog) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(error),
      });

      if (!response.ok) {
        console.warn('Failed to send error to monitoring');
      }
    } catch (e) {
      console.warn('Error monitoring service unavailable');
    }
  }

  getRecentErrors(count: number = 10): ErrorLog[] {
    return this.errorLogs.slice(-count);
  }

  clearErrors(): void {
    this.errorLogs = [];
  }

  exportErrors(): string {
    return JSON.stringify(this.errorLogs, null, 2);
  }
}

export const errorHandler = ErrorHandler.getInstance();

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    errorHandler.logError({
      errorCode: code,
      message,
      stack: this.stack,
      severity,
      context,
    });
  }
}

export function handleError(
  error: unknown,
  context?: Record<string, any>
): { message: string; errorId: string } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      errorId: errorHandler.logError({
        errorCode: error.code,
        message: error.message,
        stack: error.stack,
        severity: error.severity,
        context: { ...error.context, ...context },
      }),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      errorId: errorHandler.logError({
        errorCode: 'UNKNOWN_ERROR',
        message: error.message,
        stack: error.stack,
        severity: 'medium',
        context,
      }),
    };
  }

  return {
    message: 'Une erreur inattendue est survenue',
    errorId: errorHandler.logError({
      errorCode: 'UNKNOWN_ERROR',
      message: String(error),
      severity: 'medium',
      context,
    }),
  };
}

export const ERROR_CODES = {
  AUTH_FAILED: 'AUTH_001',
  AUTH_SESSION_EXPIRED: 'AUTH_002',
  AUTH_UNAUTHORIZED: 'AUTH_003',

  PATIENT_NOT_FOUND: 'PATIENT_001',
  PATIENT_INVALID_DATA: 'PATIENT_002',
  PATIENT_CREATE_FAILED: 'PATIENT_003',

  APPOINTMENT_NOT_FOUND: 'APPT_001',
  APPOINTMENT_CONFLICT: 'APPT_002',
  APPOINTMENT_INVALID_TIME: 'APPT_003',

  PAYMENT_FAILED: 'PAY_001',
  PAYMENT_INVALID_METHOD: 'PAY_002',
  PAYMENT_DECLINED: 'PAY_003',

  EMAIL_SEND_FAILED: 'EMAIL_001',
  EMAIL_INVALID_CONFIG: 'EMAIL_002',
  EMAIL_DOMAIN_UNVERIFIED: 'EMAIL_003',

  DATABASE_QUERY_FAILED: 'DB_001',
  DATABASE_CONNECTION_FAILED: 'DB_002',

  VALIDATION_FAILED: 'VAL_001',
  VALIDATION_REQUIRED_FIELD: 'VAL_002',
  VALIDATION_INVALID_FORMAT: 'VAL_003',

  NETWORK_ERROR: 'NET_001',
  NETWORK_TIMEOUT: 'NET_002',
} as const;
