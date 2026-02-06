# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| < 0.3.0 | :x:                |

## Security Features

PagerTS implements several security measures to protect users:

### Input Validation

- **URL Validation**: All URLs are validated before processing
- **Protocol Restrictions**: Only `http://`, `https://`, and `file://` protocols are allowed
- **Length Limits**: URLs are limited to 2048 characters to prevent DoS attacks
- **Pattern Detection**: Suspicious patterns (javascript:, data:, etc.) are blocked

### Rate Limiting

- Requests are rate-limited to prevent abuse (default: 50 requests per minute)
- Configurable rate limits per instance

### Safe HTML Parsing

- JSDOM is configured to run in secure mode
- JavaScript execution from fetched pages is disabled
- Timeouts prevent hanging on slow resources
- Retry logic with exponential backoff for transient failures

### Data Sanitization

- HTML content is sanitized to prevent XSS attacks
- Special characters are properly escaped in output

## Reporting a Vulnerability

We take the security of PagerTS seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to the maintainer or through GitHub's private vulnerability reporting feature.

Please include the following information:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge your report within 48 hours
- **Communication**: We will keep you informed about the progress of fixing the issue
- **Credit**: We will give you credit for the discovery when we announce the fix (unless you prefer to remain anonymous)

## Security Best Practices for Users

When using PagerTS, follow these security guidelines:

### 1. Be Cautious with URLs

```bash
# Good - trusted domain
pagerts https://example.com

# Bad - suspicious or untrusted URLs
pagerts javascript:alert(1)  # Will be blocked
pagerts data:text/html,...   # Will be blocked
```

### 2. Use Environment Variables for Sensitive Data

Never hardcode sensitive information. Use environment variables:

```bash
# Create a .env file (never commit this!)
API_KEY=your_secret_key

# Use it in your scripts
pagerts $TARGET_URL
```

### 3. Validate Output

Always validate and sanitize output before using it in other systems:

```bash
# Pipe through jq for safe JSON processing
pagerts https://example.com | jq '.'
```

### 4. Keep Dependencies Updated

Regularly update PagerTS and its dependencies:

```bash
npm update -g pagerts
```

### 5. Network Security

- Use HTTPS URLs whenever possible
- Be cautious when fetching from local networks
- Consider using a VPN or proxy for sensitive operations

### 6. File System Access

When using `file://` URLs:

- Ensure you have appropriate permissions
- Be cautious with symbolic links
- Validate file paths to prevent directory traversal

## Security Checklist for Contributors

If you're contributing to PagerTS, ensure your code:

- [ ] Validates all user input
- [ ] Uses parameterized queries (if applicable)
- [ ] Properly escapes output
- [ ] Handles errors gracefully without exposing sensitive information
- [ ] Includes tests for security-critical functionality
- [ ] Doesn't introduce new dependencies without security review
- [ ] Follows the principle of least privilege
- [ ] Includes appropriate logging (without logging sensitive data)

## Dependencies

PagerTS regularly audits its dependencies for security vulnerabilities. Run the security check:

```bash
npm run security:check
```

## Automated Security Testing

PagerTS uses:

- **npm audit**: Checks for known vulnerabilities in dependencies
- **ESLint with security plugin**: Static analysis for security issues
- **GitHub Dependabot**: Automated dependency updates
- **GitHub Actions**: CI/CD with security scanning

## Contact

For security concerns, contact: [GitHub Issues](https://github.com/akinevz0/pagerts/issues)

## Acknowledgments

We thank the following researchers for responsibly disclosing vulnerabilities:

- (None yet - be the first!)
