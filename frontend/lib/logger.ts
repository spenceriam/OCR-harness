/**
 * Frontend logging system for OCR-harness
 * Captures all errors and events without requiring DevTools
 */
import { nanoid } from 'nanoid';

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: 'FRONTEND' | 'BACKEND' | 'MODEL' | 'SYSTEM';
  component: string;
  message: string;
  details?: Record<string, any>;
  sessionId: string;
}

class FrontendLogger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;
  private readonly sessionId: string;
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  constructor() {
    this.sessionId = nanoid();
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers();
    }
  }

  private setupGlobalErrorHandlers() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.log('ERROR', `Unhandled error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Capture promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.log('ERROR', 'Unhandled promise rejection', {
        reason: event.reason,
      });
    });
  }

  log(level: LogLevel, message: string, details?: any) {
    const entry: LogEntry = {
      id: nanoid(),
      timestamp: new Date(),
      level,
      source: 'FRONTEND',
      component: this.getCallerComponent(),
      message,
      details: this.sanitizeDetails(details),
      sessionId: this.sessionId
    };

    this.logs.push(entry);
    this.trimLogs();
    this.notifyListeners();

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level}] ${message}`, details);
    }
  }

  private sanitizeDetails(details: any): any {
    if (!details) return undefined;

    const sanitized = { ...details };
    // Remove sensitive data
    const sensitiveKeys = [
      'fileContent', 'extractedText', 'imageData',
      'password', 'token', 'apiKey'
    ];

    sensitiveKeys.forEach(key => delete sanitized[key]);
    return sanitized;
  }

  private getCallerComponent(): string {
    // Parse stack trace to get component name
    try {
      const stack = new Error().stack;
      const match = stack?.match(/at (\w+).*\/components\/(\w+)/);
      return match?.[2] || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  private trimLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.logs));
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getLogs(filter?: { level?: LogLevel }): LogEntry[] {
    if (!filter) return [...this.logs];

    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      return true;
    });
  }

  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  exportLogs(format: 'json' | 'txt'): Blob {
    if (format === 'json') {
      return new Blob(
        [JSON.stringify(this.logs, null, 2)],
        { type: 'application/json' }
      );
    }

    const text = this.logs.map(log =>
      `[${log.timestamp.toISOString()}] ${log.level} - ${log.component}: ${log.message}${log.details ? '\n  Details: ' + JSON.stringify(log.details) : ''
      }`
    ).join('\n\n');

    return new Blob([text], { type: 'text/plain' });
  }

  generateErrorReport(error?: Error): object {
    const errorLogs = this.logs.filter(l => l.level === 'ERROR');

    return {
      reportId: nanoid(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      currentError: error ? {
        message: error.message,
        stack: error.stack
      } : null,
      recentErrors: errorLogs.slice(-10),
      allLogsCount: this.logs.length,
      systemInfo: typeof window !== 'undefined' ? {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: {
          width: screen.width,
          height: screen.height,
          pixelRatio: window.devicePixelRatio
        },
        timestamp: new Date().toISOString()
      } : {}
    };
  }
}

export const logger = new FrontendLogger();
