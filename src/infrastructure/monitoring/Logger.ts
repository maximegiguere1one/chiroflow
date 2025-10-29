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
  stack?: string;
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
    };

    this.logs.push(entry);

    if (import.meta.env.DEV) {
      const method = level >= LogLevel.ERROR ? 'error' : level >= LogLevel.WARN ? 'warn' : 'log';
      console[method](`[${LogLevel[level]}]`, message, context);
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
    return undefined;
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
