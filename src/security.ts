/**
 * Security utilities for URL validation and sanitization
 */

import { isIP } from 'node:net';

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const MAX_URL_LENGTH = 2048;
const SUSPICIOUS_PATTERNS = [
  /javascript:/i,
  /data:/i,
  /vbscript:/i,
  /<script/i,
  /on\w+=/i, // Event handlers like onclick=
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

export interface UrlValidationOptions {
  allowPrivateHosts?: boolean;
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  if (normalized === 'localhost' || normalized.endsWith('.localhost')) {
    return true;
  }

  const ipType = isIP(normalized);
  if (ipType === 0) {
    return false;
  }

  if (ipType === 4) {
    const octets = normalized.split('.').map(Number);
    if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) {
      return false;
    }

    const [a, b] = octets;
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    );
  }

  // IPv6 private/internal ranges.
  return (
    normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  );
}

/**
 * Validates a URL for security concerns
 * @param url - The URL to validate
 * @returns ValidationResult object with validation status
 */
export function validateUrl(url: string, options: UrlValidationOptions = {}): ValidationResult {
  // Check if URL is empty or whitespace
  if (!url || !url.trim()) {
    return {
      isValid: false,
      error: 'URL cannot be empty',
    };
  }

  const trimmedUrl = url.trim();

  // Check URL length to prevent DoS
  if (trimmedUrl.length > MAX_URL_LENGTH) {
    return {
      isValid: false,
      error: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters`,
    };
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(trimmedUrl)) {
      return {
        isValid: false,
        error: 'URL contains suspicious patterns',
      };
    }
  }

  // Parse the URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }

  // Check protocol
  if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
    return {
      isValid: false,
      error: `Protocol ${parsedUrl.protocol} is not allowed. Allowed protocols: ${ALLOWED_PROTOCOLS.join(', ')}`,
    };
  }

  if (parsedUrl.username || parsedUrl.password) {
    return {
      isValid: false,
      error: 'URLs with embedded credentials are not allowed',
    };
  }

  if (!options.allowPrivateHosts && isPrivateHostname(parsedUrl.hostname)) {
    return {
      isValid: false,
      error:
        'Private or loopback hostnames are blocked by default. Use --allow-private-hosts if you trust the target.',
    };
  }

  return {
    isValid: true,
    sanitizedUrl: parsedUrl.toString(),
  };
}

/**
 * Validates an array of URLs
 * @param urls - Array of URLs to validate
 * @returns Object with valid URLs and errors
 */
export function validateUrls(
  urls: string[],
  options: UrlValidationOptions = {}
): {
  validUrls: string[];
  errors: Array<{ url: string; error: string }>;
} {
  const validUrls: string[] = [];
  const errors: Array<{ url: string; error: string }> = [];

  for (const url of urls) {
    const result = validateUrl(url, options);
    if (result.isValid && result.sanitizedUrl) {
      validUrls.push(result.sanitizedUrl);
    } else {
      errors.push({
        url,
        error: result.error || 'Unknown validation error',
      });
    }
  }

  return { validUrls, errors };
}

/**
 * Rate limiter to prevent abuse
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed under rate limiting
   * @returns true if request is allowed, false otherwise
   */
  public isAllowed(): boolean {
    const now = Date.now();

    // Remove old requests outside the time window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  /**
   * Get remaining requests in current window
   */
  public getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
