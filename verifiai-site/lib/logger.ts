// Structured logging utility with request IDs
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { scrubPIIFromObject } from './security';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  orgId?: string;
  documentId?: string;
  analysisId?: string;
  action?: string;
  duration?: number;
  [key: string]: any;
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private createLog(level: LogLevel, message: string, context: LogContext = {}, error?: Error): StructuredLog {
    // Scrub PII from message and context
    const scrubbedMessage = this.isDevelopment ? message : scrubPIIFromObject(message);
    const scrubbedContext = this.isDevelopment ? context : scrubPIIFromObject(context);
    
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message: scrubbedMessage,
      context: {
        ...scrubbedContext,
        environment: process.env.NODE_ENV || 'development',
      }
    };

    if (error) {
      log.error = {
        name: error.name,
        message: this.isDevelopment ? error.message : scrubPIIFromObject(error.message),
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    return log;
  }

  private output(log: StructuredLog) {
    if (this.isDevelopment) {
      // Pretty print for development
      const contextStr = Object.keys(log.context).length > 0 
        ? ` | ${JSON.stringify(log.context, null, 2)}`
        : '';
      
      const errorStr = log.error 
        ? `\nError: ${log.error.name}: ${log.error.message}${log.error.stack ? '\n' + log.error.stack : ''}`
        : '';

      console.log(`[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${contextStr}${errorStr}`);
    } else {
      // JSON output for production
      console.log(JSON.stringify(log));
    }
  }

  debug(message: string, context?: LogContext) {
    this.output(this.createLog('debug', message, context));
  }

  info(message: string, context?: LogContext) {
    this.output(this.createLog('info', message, context));
  }

  warn(message: string, context?: LogContext, error?: Error) {
    this.output(this.createLog('warn', message, context, error));
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.output(this.createLog('error', message, context, error));
  }

  // Request-specific logging methods
  request(req: NextRequest, message: string, context?: LogContext) {
    const requestId = this.getRequestId(req);
    this.info(message, {
      ...context,
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent') || undefined,
    });
  }

  requestError(req: NextRequest, message: string, error: Error, context?: LogContext) {
    const requestId = this.getRequestId(req);
    this.error(message, {
      ...context,
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent') || undefined,
    }, error);
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext) {
    this.info(`Performance: ${operation}`, {
      ...context,
      duration,
      operation,
    });
  }

  // Get or create request ID
  getRequestId(req: NextRequest): string {
    // Try to get existing request ID from headers
    let requestId = req.headers.get('x-request-id');
    
    if (!requestId) {
      // Generate new request ID
      requestId = randomUUID();
      // In a real implementation, you'd set this in middleware
    }
    
    return requestId;
  }
}

// Export singleton instance
export const logger = new Logger();

// Utility function to measure execution time
export async function measureTime<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.performance(operation, duration, context);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${operation} failed`, { ...context, duration }, error as Error);
    throw error;
  }
}

// Utility function to create request context
export function createRequestContext(req: NextRequest, additionalContext?: LogContext): LogContext {
  return {
    requestId: logger.getRequestId(req),
    method: req.method,
    url: req.url,
    ...additionalContext,
  };
}
