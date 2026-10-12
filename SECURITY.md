# Security Policy

## Supported Versions

The current `1.6.x` line is the maintained version line. Update to the latest
available patch release before reporting an issue.

## Security Considerations

PagerTS is a URL-fetching CLI. Treat URLs and local-file inputs as sensitive:

- Remote URLs are fetched directly by jsdom. PagerTS does not implement an
  application-level URL allowlist, request rate limit, or timeout.
- Requests for multiple URLs run concurrently.
- `file://` inputs are read using the permissions of the current operating
  system user. Do not pass untrusted file paths.
- Parsed page content is not a security sanitizer. Escape or sanitize extracted
  values before embedding the JSON output in HTML or another executable format.
- `npm audit` checks known dependency advisories; it does not assess the
  application code.

Use this tool only with URLs and files you are authorized to access. In
particular, avoid fetching untrusted URLs that may point to private network
services.

## Reporting a Vulnerability

Please do not disclose suspected vulnerabilities in public issues. Report
them privately through
[GitHub's security advisory reporting page](https://github.com/akinevz2/pagerts/security/advisories/new).
Include the affected version or commit, impact, and reproducible steps where
possible. Please avoid sharing real credentials or sensitive data in a
proof-of-concept.

## Dependency Audit

To check installed dependencies for known vulnerabilities, run:

```bash
npm audit --ignore-scripts --audit-level=moderate
```

This audit does not replace review of application behavior or the security
considerations above.

## Testing

Run the offline CLI integration tests with:

```bash
npm test
```

These tests mock jsdom's network and file loaders. They verify basic extraction
and JSON output; they are not a security test suite and do not validate
protection against malicious URLs or page content.
