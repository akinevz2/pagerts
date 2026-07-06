# PagerTS

[![CI/CD Security Pipeline](https://github.com/akinevz2/pagerts/actions/workflows/ci.yml/badge.svg)](https://github.com/akinevz2/pagerts/actions/workflows/ci.yml)
[![Security](https://img.shields.io/badge/security-maintained-green.svg)](./SECURITY.md)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

PagerTS is a secure, modern command-line utility that transforms URLs into structured JSON objects, extracting all navigable items and resources from webpages.

## Features

- 🔒 **Security-First**: Built-in URL validation, rate limiting, and XSS protection
- 🚀 **Modern TypeScript**: Strict type checking and modern ES2022 syntax
- ⚡ **Fast**: Efficient parsing with LinkeDOM and concurrent request handling
- 🧪 **Well-Tested**: Comprehensive test coverage with Jest
- 📦 **Easy to Use**: Simple CLI interface with sensible defaults
- 🗂️ **Local File Support**: bare `pagerts` parses local file paths and `file:///...` inputs
- 🧭 **Request Header Override**: Optional `--user-agent` flag for sites that behave differently by client

## Installation

### Global Installation

```bash
npm install -g pagerts
pagerts ./page.html
```

### Using npx (No Installation Required)

```bash
npx pagerts ./page.html
```

### From Source

```bash
git clone https://github.com/akinevz2/pagerts.git
cd pagerts
npm install
npm run build
npm link
```

## Usage

### Basic Usage

Extract resources from a local HTML file path:

```bash
pagerts ./page.html
```

Extract resources from a local file URL:

```bash
pagerts file:///path/to/file.html
```

Fetch resources from a remote URL:

```bash
pagerts fetch https://website.com
```

Override the HTTP user-agent for remote fetches:

```bash
pagerts fetch --user-agent "Mozilla/5.0 (X11; Linux x86_64; rv:139.0) Gecko/20100101 Firefox/139.0" https://example.com
```

Allow fetching from localhost/private-network targets (opt-in):

```bash
pagerts fetch --allow-private-hosts http://127.0.0.1:3000
```

Fetch from multiple remote URLs:

```bash
pagerts fetch https://example.com https://example.org
```

### Output Format

The output is a JSON object containing:

```json
{
  "title": "Page Title",
  "url": "https://example.com",
  "resources": [
    {
      "name": "Link Text",
      "url": "https://example.com/page"
    }
  ]
}
```

Fields:

- `title`: The page's title extracted from the `<title>` tag
- `url`: The URL of the page
- `resources`: Array of resources found on the page (links, meta tags, embeds)
  - `name`: Readable text or description
  - `url`: Target URL of the resource

## Security

PagerTS takes security seriously. See [SECURITY.md](./SECURITY.md) for:

- Security features and protections
- How to report vulnerabilities
- Best practices for users
- Security checklist for contributors

### Built-in Security Features

- ✅ URL validation for remote fetches (only allows `http://` and `https://`)
- ✅ Private/loopback hosts are blocked by default for remote fetches (SSRF mitigation)
- ✅ Local filesystem parsing through plain paths and `file://` inputs on the root command
- ✅ Input sanitization to prevent XSS attacks
- ✅ Rate limiting (50 requests/minute by default)
- ✅ Request timeouts to prevent hanging
- ✅ HTTP status and content-type checks for remote responses
- ✅ Maximum remote HTML response size enforcement (2 MiB)
- ✅ Maximum URL length enforcement
- ✅ Suspicious pattern detection
- ✅ Safe HTML parsing (no script execution)

## Development

### Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/akinevz2/pagerts.git
cd pagerts

# Install dependencies
npm install

# Run in development mode
npm run dev <url>
```

### Available Scripts

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Build the project
npm run build

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check

# Format code
npm run format

# Check formatting
npm run format:check

# Security audit
npm run security:audit

# Complete security check (audit + lint)
npm run security:check
```

### Project Structure

```
pagerts/
├── src/
│   ├── main.ts                 # CLI entry point
│   ├── security.ts             # Security utilities
│   ├── resource.ts             # Resource types
│   ├── extractors/             # Content extractors
│   │   ├── AbstractExtractor.ts
│   │   ├── PageExtractor.ts
│   │   ├── ResourceExtractor.ts
│   │   └── TagExtractor.ts
│   ├── page/                   # Page fetching
│   │   ├── Page.ts
│   │   └── PageFetcher.ts
│   ├── printers/               # Output formatters
│   │   ├── AbstractResourcePrinter.ts
│   │   ├── JSONStylePrinter.ts
│   │   └── LogStylePrinter.ts
│   └── __tests__/              # Test files
├── bin/                        # Built files
├── .github/workflows/          # CI/CD pipelines
├── package.json
├── tsconfig.json
├── jest.config.cjs
├── eslint.config.mjs
└── SECURITY.md
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Write tests for new features
- Follow the existing code style (enforced by ESLint and Prettier)
- Update documentation as needed
- Ensure all tests pass (`npm test`)
- Run security checks (`npm run security:check`)
- Follow security best practices (see [SECURITY.md](./SECURITY.md))

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Author

**Kirill <kine> Nevzorov**

## Support

- 🐛 [Report bugs](https://github.com/akinevz2/pagerts/issues)
- 💡 [Request features](https://github.com/akinevz2/pagerts/issues)
- 🔒 [Report security issues](./SECURITY.md)

## Changelog

Full release history is available in [CHANGELOG.md](./CHANGELOG.md).

### v1.5.6

- Hardened remote fetch SSRF protection by validating redirect targets and enforcing a redirect limit.
- Enforced remote HTML size limits during streaming reads to reduce memory-pressure DoS risk.
- Sanitized log-style output to strip terminal control characters from untrusted page content.
- Added regression tests for redirect validation, streamed size limiting, and terminal output sanitization.
- Added npm allowScripts approvals for install-script dependencies to improve strict CI compatibility.

### v1.5.3

- Added `--user-agent` support to the `fetch` command so callers can override the HTTP User-Agent header for remote requests.
- Made the root `pagerts` command parse local file paths and `file:///` inputs directly, while keeping `fetch` remote-only.
- Improved CLI/runtime compatibility for locally resolved entrypoints and packaged builds.
- Updated focused tests to cover the new file-protocol validation and user-agent override behavior.

### v0.3.0 -> v1.4.3 summary

Key changes in this range:

- Security hardening and dependency-surface reduction (`863389a`).
- CI/security gate tightening and scan-noise cleanup (`da73bdb`, `46875e8`).
- Packaging/runtime interoperability fixes for CJS/ESM builds and publishes (`4054ab9`, `74d3f98`, `64b2a2f`, `e67acd6`).
- Regression fix for ignored script resources (`bc13b55`).
- Dependency tree refresh/stabilization (`1f8f86d`) and release bumps through `v1.4.3`.
- General code hardening and cleanup across extractors/fetching/printers, plus lockfile and build artifact maintenance in the same span.

### v0.2.0

- Initial public release
