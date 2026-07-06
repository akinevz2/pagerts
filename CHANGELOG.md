# Changelog

All notable changes to PagerTS are documented in this file.

## v1.5.6

- Hardened remote fetch SSRF protection by validating redirect targets and enforcing a redirect limit.
- Enforced remote HTML size limits during streaming reads to reduce memory-pressure DoS risk.
- Sanitized log-style output to strip terminal control characters from untrusted page content.
- Added regression tests for redirect validation, streamed size limiting, and terminal output sanitization.
- Added npm allowScripts approvals for install-script dependencies to improve strict CI compatibility.

## v1.5.3

- Added `--user-agent` support to the `fetch` command so callers can override the HTTP User-Agent header for remote requests.
- Made the root `pagerts` command parse local file paths and `file:///` inputs directly, while keeping `fetch` remote-only.
- Improved CLI/runtime compatibility for locally resolved entrypoints and packaged builds.
- Updated focused tests to cover the new file-protocol validation and user-agent override behavior.

## v0.3.0 -> v1.4.3 summary

Key changes in this range:

- Security hardening and dependency-surface reduction (`863389a`).
- CI/security gate tightening and scan-noise cleanup (`da73bdb`, `46875e8`).
- Packaging/runtime interoperability fixes for CJS/ESM builds and publishes (`4054ab9`, `74d3f98`, `64b2a2f`, `e67acd6`).
- Regression fix for ignored script resources (`bc13b55`).
- Dependency tree refresh/stabilization (`1f8f86d`) and release bumps through `v1.4.3`.
- General code hardening and cleanup across extractors/fetching/printers, plus lockfile and build artifact maintenance in the same span.

## v0.2.0

- Initial public release
