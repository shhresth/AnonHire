import { Request, Response, NextFunction } from 'express';
import { logRequest, logSecurity, logAudit } from '../utils/logger';

/**
 * Request logging middleware
 * Logs all HTTP requests with performance metrics
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log the request
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log the request
    logRequest(req, res, duration);
    
    // Log security events for suspicious requests
    if (res.statusCode >= 400) {
      logSecurity('HTTP Error', 'medium', {
        statusCode: res.statusCode,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    // Log audit events for sensitive operations
    if (req.method !== 'GET' && req.url.includes('/api/v1/')) {
      logAudit(`${req.method} ${req.url}`, (req as any).user?.id, {
        statusCode: res.statusCode,
        duration,
        ip: req.ip
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Security logging middleware
 * Logs potential security threats
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /eval\(/i,  // Code injection
  ];
  
  const url = req.url;
  const userAgent = req.get('User-Agent') || '';
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent)) {
      logSecurity('Suspicious Request Pattern', 'high', {
        pattern: pattern.toString(),
        url,
        userAgent,
        ip: req.ip,
        method: req.method
      });
      break;
    }
  }
  
  // Check for rate limiting violations (basic implementation)
  const ip = req.ip;
  const key = `rate_limit_${ip}`;
  
  // This is a basic implementation - in production, use Redis or similar
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }
  
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // Max requests per window
  
  const requests = global.rateLimitStore.get(key) || [];
  const validRequests = requests.filter((time: number) => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    logSecurity('Rate Limit Exceeded', 'medium', {
      ip,
      requestCount: validRequests.length,
      windowMs,
      maxRequests
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
    return;
  }
  
  validRequests.push(now);
  global.rateLimitStore.set(key, validRequests);
  
  next();
};

// Extend global type for rate limiting
declare global {
  var rateLimitStore: Map<string, number[]>;
}
