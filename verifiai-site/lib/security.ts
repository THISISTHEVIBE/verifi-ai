// Security utilities for PII scrubbing, rate limiting, and file access
import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';

// PII patterns to detect and scrub from logs
const PII_PATTERNS = [
  // Email addresses
  {
    name: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL_REDACTED]'
  },
  // Phone numbers (various formats)
  {
    name: 'phone',
    pattern: /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    replacement: '[PHONE_REDACTED]'
  },
  // Social Security Numbers
  {
    name: 'ssn',
    pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    replacement: '[SSN_REDACTED]'
  },
  // Credit card numbers (basic pattern)
  {
    name: 'creditcard',
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replacement: '[CC_REDACTED]'
  },
  // IP addresses (can be considered PII in some contexts)
  {
    name: 'ip',
    pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    replacement: '[IP_REDACTED]'
  },
  // Potential passwords or tokens (long alphanumeric strings)
  {
    name: 'token',
    pattern: /\b[A-Za-z0-9]{32,}\b/g,
    replacement: '[TOKEN_REDACTED]'
  }
];

/**
 * Scrub PII from a string
 */
export function scrubPII(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let scrubbedText = text;
  
  for (const pattern of PII_PATTERNS) {
    scrubbedText = scrubbedText.replace(pattern.pattern, pattern.replacement);
  }
  
  return scrubbedText;
}

/**
 * Recursively scrub PII from an object
 */
export function scrubPIIFromObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return scrubPII(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => scrubPIIFromObject(item));
  }
  
  if (typeof obj === 'object') {
    const scrubbed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Also scrub keys that might contain PII
      const scrubbed_key = scrubPII(key);
      scrubbed[scrubbed_key] = scrubPIIFromObject(value);
    }
    return scrubbed;
  }
  
  return obj;
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiter
 */
export function checkRateLimit(
  identifier: string, 
  maxRequests: number, 
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  // Clean up expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) {
      rateLimitStore.delete(k);
    }
  }
  
  const current = rateLimitStore.get(key);
  
  if (!current || current.resetTime < now) {
    // First request or window expired
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }
  
  if (current.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  // Increment counter
  current.count++;
  rateLimitStore.set(key, current);
  
  return { 
    allowed: true, 
    remaining: maxRequests - current.count, 
    resetTime: current.resetTime 
  };
}

/**
 * Create rate limit identifier from request
 */
export function createRateLimitIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fallback to IP address
  const ip = getClientIP(req) || 'unknown';
  return `ip:${ip}`;
}

/**
 * Extract client IP from request headers
 */
export function getClientIP(request: NextRequest): string | undefined {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return undefined;
}

/**
 * Generate signed URL for file access
 */
export function generateSignedUrl(fileId: string, expiresIn: number = 3600): string {
  const expires = Math.floor(Date.now() / 1000) + expiresIn;
  const secret = process.env.FILE_SIGNING_SECRET || 'default-secret-change-in-production';
  
  // Create signature (in production, use HMAC-SHA256)
  const signature = Buffer.from(`${fileId}:${expires}:${secret}`).toString('base64url');
  
  return `/api/files/${fileId}?expires=${expires}&signature=${signature}`;
}

/**
 * Verify signed URL
 */
export function verifySignedUrl(fileId: string, expires: string, signature: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const expiresNum = parseInt(expires, 10);
  
  // Check if expired
  if (expiresNum < now) {
    return false;
  }
  
  const secret = process.env.FILE_SIGNING_SECRET || 'default-secret-change-in-production';
  const expectedSignature = Buffer.from(`${fileId}:${expires}:${secret}`).toString('base64url');
  
  return signature === expectedSignature;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts and dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255); // Limit length
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  skipSuccessfulRequests: boolean = false
) {
  return function(handler: Function) {
    return async function(req: NextRequest, ...args: any[]) {
      const identifier = createRateLimitIdentifier(req);
      const rateLimit = checkRateLimit(identifier, maxRequests, windowMs);
      
      if (!rateLimit.allowed) {
        return new Response(JSON.stringify({
          error: 'rate_limit_exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        });
      }
      
      const response = await handler(req, ...args);
      
      // Add rate limit headers to response
      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());
      }
      
      return response;
    };
  };
}
