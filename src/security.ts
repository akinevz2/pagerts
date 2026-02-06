/**
 * Security utilities for URL validation and sanitization
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'file:'];
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

/**
 * Validates a URL for security concerns
 * @param url - The URL to validate
 * @returns ValidationResult object with validation status
 */
export function validateUrl(url: string): ValidationResult {
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
  } catch (error) {
    // If URL parsing fails, it might be a file path
    if (trimmedUrl.startsWith('file://')) {
      return {
        isValid: true,
        sanitizedUrl: trimmedUrl,
      };
    }
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

  // Check for localhost/internal IPs in production (security consideration)
  const hostname = parsedUrl.hostname.toLowerCase();
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

  if (isLocalhost && parsedUrl.protocol !== 'file:') {
    // Allow but warn about localhost URLs
    console.warn(`Warning: Accessing local network resource: ${trimmedUrl}`);
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
export function validateUrls(urls: string[]): {
  validUrls: string[];
  errors: Array<{ url: string; error: string }>;
} {
  const validUrls: string[] = [];
  const errors: Array<{ url: string; error: string }> = [];

  for (const url of urls) {
    const result = validateUrl(url);
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
