# PagerTS

[![CI](https://github.com/akinevz2/pagerts/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/akinevz2/pagerts/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

PagerTS is a command-line tool that fetches web pages and writes their title,
URL, and external resources as JSON.

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

The build uses the TypeScript compiler (`tsc`). It emits JavaScript and source
maps into `bin/`.

## Use

Fetch one or more HTTP(S) pages:

```bash
pagerts https://example.com https://example.org
```

Read a local HTML file with a `file://` URL:

```bash
pagerts file:///absolute/path/to/page.html
```

Restrict extraction to specific tags by listing tag names after the URLs:

```bash
pagerts https://example.com https://example.org a img
```

Print a human-readable log (`Title`, `URL`, then `value: url` lines) instead
of JSON:

```bash
pagerts --no-json https://example.com
```

Display the installed version or command help:

```bash
pagerts --version
pagerts --help
```

### Usage

```text
pagerts [options] <url | file...> [tags...]

Options:
  -v, --version  output the version number
  --no-json      print a human-readable log instead of JSON
  -h, --help     display help for command
```

Arguments containing `:` are treated as URLs; the rest are tag names. Use the
`file://` form for local files.

#### Selecting tags

List tag names after the URLs to extract only from those elements:

```bash
pagerts https://akinevz.com/ https://akinevz.dev/ script
```

```json
[
  {
    "title": "home of kine",
    "url": "https://akinevz.com/",
    "resources": [
      {
        "tag": "script",
        "key": "tag",
        "value": "script",
        "link": { "key": "src", "url": "https://akinevz.com/assets/index.js" }
      }
    ]
  },
  { "title": "home of kine — moved", "url": "https://akinevz.dev/", "resources": [] }
]
```

- Tags are matched with a CSS selector, so use bare lower-case names such as
  `a`, `img`, `link` or `script`. Several can be given: `pagerts <url> a img`.
- The tag list applies to every URL. A page with no matching elements still
  appears, with an empty `resources` array.
- Without tags, every element that carries a link property or attribute is
  considered.
- Only elements that can carry a link are returned. Naming a tag such as `div`,
  which has no `href`, `src` or `action`, yields nothing.
- Tags must come after the URLs. Anything without a `:` is read as a tag, so a
  bare local path like `page.html` is taken as a tag; use `file://`.

### Output

By default the command writes a JSON array with one entry per URL. A
successfully fetched page has a `title`, `url`, and a `resources` array:

```json
[
  {
    "title": "home of kine",
    "url": "https://akinevz.com/",
    "resources": [
      {
        "tag": "link",
        "key": "rel",
        "value": "canonical",
        "link": { "key": "href", "url": "https://akinevz.com/" }
      },
      {
        "tag": "script",
        "key": "tag",
        "value": "script",
        "link": { "key": "src", "url": "https://akinevz.com/assets/index.js" }
      },
      {
        "tag": "a",
        "key": "textContent",
        "value": "github.com/akinevz2",
        "link": { "key": "href", "url": "https://github.com/akinevz2" }
      }
    ]
  }
]
```

Each resource has:

| Field      | Description                                                                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tag`      | Lowercase name of the element, e.g. `a`, `link`, `script`.                                                                                                                  |
| `key`      | Property that supplied `value`: the first non-empty of `id`, `innerText`, `textContent`, `className`, `ariaLabel`, `ariaDescription`, `alt`, `rel`. `tag` when none is set. |
| `value`    | Display text taken from `key`. When `key` is `tag`, this is the tag name.                                                                                                   |
| `link.key` | Property that supplied the URL: `href`, `action`, `src`, or the attributes `data-src` and `url`.                                                                            |
| `link.url` | The link value.                                                                                                                                                             |

A page that fails to fetch or has no content is reported as `{ "error": "..." }`.

Without tag names, PagerTS considers every element that carries a link
property or attribute. It includes an element only when its link value begins
with `http`.

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
workflow also checks formatting, types, dependencies, and runs CodeQL.

## Security

PagerTS fetches supplied URLs and supports local `file://` URLs. It does not
provide an application-level URL allowlist, request rate limit, or timeout.
Only fetch URLs you trust, and take care not to provide URLs that can access
private network services or local files. See the [security policy](./SECURITY.md)
for details and vulnerability reporting.

## License

MIT

## Version 1.6.1

- Uses jsdom for page parsing and commander for the CLI.
- Uses `tsc` for builds and Node's built-in test runner for mocked integration tests.
- Removes Jest and esbuild from the project toolchain.
- Emits Node.js-compatible ESM from the TypeScript build.
