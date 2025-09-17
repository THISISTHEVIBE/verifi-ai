// Sentry integration for error tracking and performance monitoring
import { NextRequest } from 'next/server';

// Sentry configuration
const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';
const SENTRY_RELEASE = process.env.VERCEL_GIT_COMMIT_SHA || 'unknown';

// Mock Sentry interface for when Sentry is not available
interface MockSentry {
  captureException: (error: Error, context?: any) => void;
  captureMessage: (message: string, level?: string, context?: any) => void;
  addBreadcrumb: (breadcrumb: any) => void;
  setUser: (user: any) => void;
  setTag: (key: string, value: string) => void;
  setContext: (key: string, context: any) => void;
  startTransaction: (context: any) => MockTransaction;
}

interface MockTransaction {
  setStatus: (status: string) => void;
  setTag: (key: string, value: string) => void;
  setData: (key: string, value: any) => void;
  finish: () => void;
}

class SentryService implements MockSentry {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !!SENTRY_DSN && SENTRY_ENVIRONMENT !== 'development';
    
    if (this.isEnabled) {
      this.initSentry();
    }
  }

  private initSentry() {
    // In a real implementation, you would initialize Sentry here
    // For now, we'll just log that Sentry would be initialized
    console.log(`Sentry would be initialized with DSN: ${SENTRY_DSN?.substring(0, 20)}...`);
  }

  captureException(error: Error, context?: any) {
    if (this.isEnabled) {
      // In production, this would call Sentry.captureException
      console.error('Sentry would capture exception:', error.message, context);
    } else {
      console.error('Exception:', error.message, context);
    }
  }

  captureMessage(message: string, level: string = 'info', context?: any) {
    if (this.isEnabled) {
      // In production, this would call Sentry.captureMessage
      console.log(`Sentry would capture message [${level}]:`, message, context);
    } else {
      console.log(`Message [${level}]:`, message, context);
    }
  }

  addBreadcrumb(breadcrumb: any) {
    if (this.isEnabled) {
      // In production, this would call Sentry.addBreadcrumb
      console.debug('Sentry breadcrumb:', breadcrumb);
    }
  }

  setUser(user: any) {
    if (this.isEnabled) {
      // In production, this would call Sentry.setUser
      console.debug('Sentry user context:', user);
    }
  }

  setTag(key: string, value: string) {
    if (this.isEnabled) {
      // In production, this would call Sentry.setTag
      console.debug(`Sentry tag: ${key}=${value}`);
    }
  }

  setContext(key: string, context: any) {
    if (this.isEnabled) {
      // In production, this would call Sentry.setContext
      console.debug(`Sentry context ${key}:`, context);
    }
  }

  startTransaction(context: any): MockTransaction {
    const transaction: MockTransaction = {
      setStatus: (status: string) => {
        if (this.isEnabled) {
          console.debug(`Transaction status: ${status}`);
        }
      },
      setTag: (key: string, value: string) => {
        if (this.isEnabled) {
          console.debug(`Transaction tag: ${key}=${value}`);
        }
      },
      setData: (key: string, value: any) => {
        if (this.isEnabled) {
          console.debug(`Transaction data: ${key}=`, value);
        }
      },
      finish: () => {
        if (this.isEnabled) {
          console.debug('Transaction finished');
        }
      }
    };

    if (this.isEnabled) {
      console.debug('Sentry transaction started:', context);
    }

    return transaction;
  }
}

// Export singleton instance
export const sentry = new SentryService();

// Utility functions for common Sentry operations
export function captureAPIError(error: Error, req: NextRequest, additionalContext?: any) {
  sentry.setContext('request', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    userAgent: req.headers.get('user-agent'),
  });

  if (additionalContext) {
    sentry.setContext('additional', additionalContext);
  }

  sentry.captureException(error);
}

export function captureUserContext(user: { id: string; email?: string; name?: string }) {
  sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}

export function captureBusinessMetrics(event: string, data: any) {
  sentry.addBreadcrumb({
    category: 'business',
    message: event,
    data,
    level: 'info',
  });
}

export function startPerformanceTransaction(name: string, operation: string) {
  return sentry.startTransaction({
    name,
    op: operation,
  });
}

// Error boundary for API routes
export function withSentryErrorBoundary<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    const transaction = startPerformanceTransaction(operationName, 'api');
    
    try {
      const result = await fn(...args);
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      sentry.captureException(error as Error, {
        operation: operationName,
        args: args.length > 0 ? args[0] : undefined,
      });
      throw error;
    } finally {
      transaction.finish();
    }
  };
}
