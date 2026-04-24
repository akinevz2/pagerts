# PagerTS

[![CI/CD Security Pipeline](https://github.com/akinevz2/pagerts/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/akinevz2/pagerts/actions/workflows/ci.yml)
[![Security](https://img.shields.io/badge/security-maintained-green.svg)](./SECURITY.md)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

PagerTS is a secure, modern command-line utility that transforms URLs into structured JSON objects, extracting all navigable items and resources from webpages.

## Features

- 🔒 **Security-First**: Built-in URL validation, rate limiting, and XSS protection
- 🚀 **Modern TypeScript**: Strict type checking and modern ES2022 syntax
- ⚡ **Fast**: Efficient parsing with JSDOM and concurrent request handling
- 🧪 **Well-Tested**: Comprehensive test coverage with Jest
- 📦 **Easy to Use**: Simple CLI interface with sensible defaults

## Installation

### Global Installation

```bash
npm install -g pagerts
pagerts <url>
```

### Using npx (No Installation Required)

```bash
npx pagerts <url>
```

### From Source

```bash
git clone https://github.com/akinevz0/pagerts.git
cd pagerts
npm install
npm run build
npm link
```

## Usage

### Basic Usage

Extract resources from a remote URL:

```bash
pagerts https://example.com
```

Extract from multiple URLs:

```bash
pagerts https://example.com https://example.org
```

Extract from a local HTML file:

```bash
pagerts file:///path/to/file.html
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

- ✅ URL validation (only allows `http://`, `https://`, `file://`)
- ✅ Input sanitization to prevent XSS attacks
- ✅ Rate limiting (50 requests/minute by default)
- ✅ Request timeouts to prevent hanging
- ✅ Maximum URL length enforcement
- ✅ Suspicious pattern detection
- ✅ Safe HTML parsing (no script execution)

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/akinevz0/pagerts.git
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
├── jest.config.js
├── eslint.config.js
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

- 🐛 [Report bugs](https://github.com/akinevz0/pagerts/issues)
- 💡 [Request features](https://github.com/akinevz0/pagerts/issues)
- 🔒 [Report security issues](./SECURITY.md)

## Changelog

### v0.3.0 (Latest)

- ✨ Added comprehensive security features
- ✨ Implemented URL validation and sanitization
- ✨ Added rate limiting
- ✨ Modernized codebase with TypeScript strict mode
- ✨ Added ESLint with security plugin
- ✨ Added comprehensive test suite
- ✨ Added CI/CD with GitHub Actions
- ✨ Improved error handling and retry logic
- 📚 Added security documentation

### v0.2.0

- Initial public release
