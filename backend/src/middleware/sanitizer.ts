import mongoSanitize from 'express-mongo-sanitize';
import type { Request, Response, NextFunction } from 'express';

// Prevent NoSQL injection by sanitizing MongoDB operators
export const sanitize = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }: { req: Request; key: string }) => {
    console.warn(`Sanitized key ${key} in request`, {
      url: req.originalUrl,
      requestId: req.requestId,
    });
  },
});

// Basic XSS prevention by stripping out script tags from request body
export function xssClean(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }
  next();
}

function sanitizeObject(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      // Strip out common XSS patterns
      (obj as Record<string, string>)[key] = (obj[key] as string)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript\s*:/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key] as Record<string, unknown>);
    }
  }
}
