# PagerTS

[![CI](https://github.com/akinevz2/pagerts/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/akinevz2/pagerts/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

PagerTS is a command-line tool that fetches web pages, parses their HTML, and
reports each page's title, URL, and external resources. It can inspect common
resource-bearing tags or scan every element for selected link properties.

## Requirements

- Node.js 20 or later
- npm

## Install

Install the published package globally:

```bash
npm install --global pagerts
```

Or build from a clone:

```bash
git clone https://github.com/akinevz2/pagerts.git
cd pagerts
npm ci
npm run build
npm link
```

The build uses the TypeScript compiler (`tsc`) and emits JavaScript and source
maps into `bin/`.

## Use

Fetch one or more HTTP(S) pages:

```bash
pagerts https://example.com https://example.org
```

Read a local HTML file using a relative or absolute path, or a `file://` URL:

```bash
pagerts ./path/to/page.html
```

By default, PagerTS searches its configured resource-bearing HTML tags. Limit
the search to specific tags with `--tags`:

```bash
pagerts --tags a,img https://example.com
```

Add properties to the default link properties (`href`, `action`, and `src`):

```bash
pagerts --properties data-href,data-src https://example.com
```

Use `all` to inspect every element in each document for the selected link
properties:

```bash
pagerts all https://example.com
pagerts all --properties data-href https://example.com
```

Print a preview of the URLs and extraction settings without fetching pages:

```bash
pagerts --dry-run --tags a,img https://example.com
pagerts all --dry-run --properties data-href https://example.com
```

The default output is JSON with one entry per input URL. Use `--no-json` for a
human-readable log:

```bash
pagerts --no-json https://example.com
```

Display the installed version or command help:

```bash
pagerts --version
pagerts --help
pagerts all --help
```

## Commands and options

```text
pagerts [options] <urls...>
pagerts all [options] <urls...>
```

Root command options:

| Option                          | Description                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `-v, --version`                 | Print the version number.                                                                   |
| `--no-json`                     | Write a human-readable log instead of the default JSON output.                              |
| `-t, --tags <tags>`             | Restrict extraction to these HTML tags. Accepts comma-separated values or repeated options. |
| `-p, --properties <properties>` | Add link properties to search. Accepts comma-separated values or repeated options.          |
| `--dry-run`                     | Print the URLs and effective extraction settings without fetching.                          |
| `--timeout <ms>`                | Abort each network fetch after this many milliseconds. Omit to wait indefinitely.           |
| `-h, --help`                    | Display command help.                                                                       |

`all` options (root options such as `--no-json` and `--timeout <ms>` are also
accepted):

| Option                          | Description                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `-p, --properties <properties>` | Add link properties to search across all document elements. Accepts comma-separated values. |
| `--dry-run`                     | Print the URLs and effective link properties without fetching.                              |
| `-h, --help`                    | Display command help.                                                                       |

The `all` command scans every document element and does not use `--tags`.
Both modes include the default link properties `href`, `action`, and `src`;
`--properties` adds to that set. An element is reported when a selected
property or attribute contains an external resource URL beginning with `http`.

## Output

The default output is a JSON array with one entry per input URL. A
successfully parsed page has a `title`, `url`, and `resources` array:

```json
[
  {
    "title": "Example page",
    "url": "https://example.com/",
    "resources": [
      {
        "tag": "a",
        "key": "textContent",
        "value": "Documentation",
        "link": {
          "key": "href",
          "url": "https://example.com/docs"
        }
      }
    ]
  }
]
```

Each resource has these fields:

| Field      | Description                                                                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tag`      | Lowercase element tag name, such as `a`, `link`, or `script`.                                                                                                                                                                                      |
| `key`      | Element property used for its display value. The extractor selects the first available value from `id`, `innerText`, `textContent`, `className`, `ariaLabel`, `ariaDescription`, `alt`, and `rel`; if none is set, the element's tag name is used. |
| `value`    | Display value taken from `key`. When `key` is `tag`, this is the tag name.                                                                                                                                                                         |
| `link.key` | Link property or attribute that supplied the URL, for example `href`, `action`, `src`, or a user-specified property.                                                                                                                               |
| `link.url` | The extracted resource URL.                                                                                                                                                                                                                        |

A fetch or parsing failure is represented by an entry with an `error` field
containing the failed URL and the reason.

`--dry-run` does not fetch input URLs. It prints the URLs and effective
extraction settings; in the default JSON output, this has `urls`, `tags`, and
`properties` fields. The `all` command reports `["*"]` for `tags` to indicate
that it scans every document element.

## Development

Install dependencies and run the local CLI:

```bash
npm ci
npm run dev -- https://example.com
```

Available checks and commands:

```bash
npm run build
npm run type-check
npm test
npm run format
npm run format:check
npm audit --ignore-scripts --audit-level=moderate
```

`npm test` builds the project and runs offline integration tests with Node's
built-in test runner. The tests mock jsdom's network and file loaders. The CI
workflow checks formatting and types, audits dependencies, and runs CodeQL.

## Security

PagerTS fetches supplied URLs and supports local file paths and `file://` URLs.
It does not provide an application-level URL allowlist, request rate limit, or
timeout. Only fetch URLs you trust, and take care not to provide URLs that can
access private network services or local files. See the
[security policy](./SECURITY.md) for details and vulnerability reporting.

## License

MIT
akinevz@outlook.com
