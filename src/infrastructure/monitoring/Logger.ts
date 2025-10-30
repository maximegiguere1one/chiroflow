export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  stack?: string;
  duration?: number;
  metadata?: {
    component?: string;
    action?: string;
    [key: string]: any;
  };
}

export interface IRemoteLogger {
  send(logs: LogEntry[]): Promise<void>;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private remoteLogger?: IRemoteLogger;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  configure(config: { remoteLogger?: IRemoteLogger }): void {
    this.remoteLogger = config.remoteLogger;
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
    this.flush();
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      requestId: this.getRequestId(),
    };

    this.logs.push(entry);

    if (import.meta.env.DEV) {
      const method = level >= LogLevel.ERROR ? 'error' : level >= LogLevel.WARN ? 'warn' : 'log';
      const logData = {
        timestamp: entry.timestamp.toISOString(),
        level: LogLevel[level],
        message,
        requestId: entry.requestId,
        userId: entry.userId,
        sessionId: entry.sessionId,
        ...context,
      };
      console[method](JSON.stringify(logData));
    }

    if (level >= LogLevel.ERROR || this.logs.length >= 50) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.logs.length === 0 || !this.remoteLogger) return;

    const logsToSend = [...this.logs];
    this.logs = [];

    try {
      await this.remoteLogger.send(logsToSend);
    } catch (error) {
      console.error('Failed to send logs', error);
      this.logs.unshift(...logsToSend);
    }
  }

  private getCurrentUserId(): string | undefined {
    try {
      const authData = localStorage.getItem('chiroflow-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.user?.id;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  private getRequestId(): string {
    let requestId = (window as any).__currentRequestId;
    if (!requestId) {
      requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      (window as any).__currentRequestId = requestId;
    }
    return requestId;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }
}

export const logger = Logger.getInstance();
