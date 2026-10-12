# Build and Verify

Installing dependencies from a source checkout runs the `prepare` script, which
builds the CLI with TypeScript. To build explicitly:

```bash
npm ci
npm run build
```

The compiler writes the executable entry point to `bin/main.js`. Check the
build, type-check, and CLI version with:

```bash
npm run type-check
npm run build
npm start -- --version
```

The integration tests run with Node's built-in test runner and mock jsdom's
network and file loaders:

```bash
npm test
```

Formatting can be checked with `npm run format:check`, and dependency
advisories can be checked with:

```bash
npm audit --ignore-scripts --audit-level=moderate
```

See the [README](./README.md) for installation and usage, and the
[security policy](./SECURITY.md) for security guidance and vulnerability
reporting.
