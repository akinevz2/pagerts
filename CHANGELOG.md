# Changelog

All notable changes to PagerTS are documented in this file.

## v2.0.5

- Added `--timeout <ms>` to abort each network fetch after the given number of milliseconds; the default remains no timeout.
- Made per-page failures verbose: load errors are reported as `Failed to load <url>: <reason>` entries in the output, including the URL and reason, in both JSON and human-readable modes.
- The CLI now exits promptly after printing output; a timed-out fetch no longer leaves the process hanging on a pending socket.
- Restructured the build: the executable entry (`bin/main.js`) is separate from the library API (`bin/lib.js`), so tests can import `run`, `runAll`, and `printDryRun` without executing the CLI.
- Packaging cleanup: removed stale bundled artifacts (a duplicate `bin/src/` tree, `bin/main.js.backup|fixed|temp|wrong`, and an outdated `bin/package.json`) so `npm pack` ships only the current build.
- Updated the README for JSON-by-default output (`--no-json`), documented `--timeout <ms>`, and noted the failure-entry format.

## v1.5.12

- Bumped `js-yaml` to `4.3.2` (via `npm audit fix`) to remediate a high-severity vulnerability: `maxTotalMergeKeys` does not limit CPU use for empty merge sources, allowing CPU exhaustion (GHSA-2883-xcg3-v3hh) affecting js-yaml 4.0.0–4.3.1.

## v1.5.11

- Improved README documentation: added a table of contents and documented previously missing CLI features — the `file` subcommand, the `fetch --watch` resize-aware mode, and the `--no-failsafe` flag for bypassing the file-limit safety check.

## v1.5.10

- Bumped `@humanfs/node` to `0.16.8` (via `npm audit fix`) to remediate a moderate-severity vulnerability: recursive copy follows symlinked files and copies data from outside the source tree (GHSA-p498-v437-472g) affecting @humanfs/node < 0.16.8, a transitive dev dependency of eslint.

## v1.5.9

- Bumped `browserslist` to `4.28.8` (via `npm audit fix`) to remediate high-severity vulnerabilities: unbounded memory growth without cache eviction leading to OOM (GHSA-c83g-rgw3-j3cx) and uncaught crash / prototype write via untrusted `browserslist-stats.json` (GHSA-73wf-gq98-2v4g) affecting browserslist <=4.28.6.
- Refreshed transitive dev dependencies (`update-browserslist-db` 1.3.2, `caniuse-lite` 1.0.30001810).

## v1.5.8

- Bumped `js-yaml` override to `^4.3.1` to remediate high-severity quadratic CPU consumption vulnerability (CVE-2026-59870 / GHSA-5p4m-2wfm-xmqj) affecting js-yaml 4.0.0–4.3.0.
- Restores the CI security-audit gate to passing.

## v1.5.7

- Bumped `brace-expansion` override to `^2.1.3` to remediate a dependency-tree vulnerability.

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
