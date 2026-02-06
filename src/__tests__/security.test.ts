import { validateUrl, validateUrls, RateLimiter, sanitizeText } from '../security';

describe('Security Module', () => {
  describe('validateUrl', () => {
    it('should validate a proper HTTPS URL', () => {
      const result = validateUrl('https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://example.com/');
    });

    it('should validate a proper HTTP URL', () => {
      const result = validateUrl('http://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should validate a file:// URL', () => {
      const result = validateUrl('file:///path/to/file.html');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty URLs', () => {
      const result = validateUrl('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject URLs with javascript: protocol', () => {
      const result = validateUrl('javascript:alert(1)');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('suspicious');
    });

    it('should reject URLs with data: protocol', () => {
      const result = validateUrl('data:text/html,<script>alert(1)</script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('suspicious');
    });

    it('should reject URLs exceeding maximum length', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(3000);
      const result = validateUrl(longUrl);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });

    it('should reject URLs with script tags', () => {
      const result = validateUrl('https://example.com/<script>alert(1)</script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('suspicious');
    });

    it('should reject invalid URL formats', () => {
      const result = validateUrl('not-a-valid-url');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });

    it('should trim whitespace from URLs', () => {
      const result = validateUrl('  https://example.com  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://example.com/');
    });
  });

  describe('validateUrls', () => {
    it('should validate multiple URLs and separate valid from invalid', () => {
      const urls = ['https://example.com', 'javascript:alert(1)', 'http://test.com', 'invalid-url'];
      const result = validateUrls(urls);

      expect(result.validUrls.length).toBe(2);
      expect(result.errors.length).toBe(2);
      expect(result.validUrls).toContain('https://example.com/');
      expect(result.validUrls).toContain('http://test.com/');
    });

    it('should return empty arrays for empty input', () => {
      const result = validateUrls([]);
      expect(result.validUrls.length).toBe(0);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within the limit', () => {
      const limiter = new RateLimiter(5, 1000);

      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed()).toBe(true);
      }
    });

    it('should block requests exceeding the limit', () => {
      const limiter = new RateLimiter(3, 1000);

      // Use up all allowed requests
      for (let i = 0; i < 3; i++) {
        limiter.isAllowed();
      }

      // Next request should be blocked
      expect(limiter.isAllowed()).toBe(false);
    });

    it('should reset after the time window', async () => {
      const limiter = new RateLimiter(2, 100); // 100ms window

      limiter.isAllowed();
      limiter.isAllowed();
      expect(limiter.isAllowed()).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      expect(limiter.isAllowed()).toBe(true);
    });

    it('should correctly report remaining requests', () => {
      const limiter = new RateLimiter(5, 1000);

      expect(limiter.getRemainingRequests()).toBe(5);
      limiter.isAllowed();
      expect(limiter.getRemainingRequests()).toBe(4);
      limiter.isAllowed();
      expect(limiter.getRemainingRequests()).toBe(3);
    });
  });

  describe('sanitizeText', () => {
    it('should sanitize HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const output = sanitizeText(input);
      expect(output).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('should escape quotes and apostrophes', () => {
      const input = `It's a "test"`;
      const output = sanitizeText(input);
      expect(output).toContain('&#x27;');
      expect(output).toContain('&quot;');
    });

    it('should escape forward slashes', () => {
      const input = '</script>';
      const output = sanitizeText(input);
      expect(output).toBe('&lt;&#x2F;script&gt;');
    });
  });
});
