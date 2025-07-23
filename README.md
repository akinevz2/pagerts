# README

PagerTS is a command line utility that provides the user with a portable tool for transforming an URL into a JSON Object.

The output of this command contains all of navigable items one can navigate to within a webpage.

## Usage

To use `pagerts` invoke it in the command line as:

```bash
pagerts https://website/page.html
```

There is also support for loading local system html resources.

## Output

The output encodes a dependency list of resources. It is parsed using JSDOM library and returned to the user as an object annotated with fields `title`, `url`, `resources`.

The last field represents a list of tuples, mapping name of the resource to a url.

The name is extracted from the readable text on the page.

## Installing

The CLI can be installed using npm:

```bash
npm i -g pagerts
pagerts <url>
```

Or run from npx:

```bash
npx pagerts <url>
```

