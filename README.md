# README

This project aims to develop an efficient application for downloading and presenting the user a list of resources that a webpage links to on the Internet.

PagerTS is a command line utility that provides the user with a portable tool for transforming an URL into a JSON Object. The output of this command represents the navigable items within a webpage.

## Usage

To use PagerTS, run it in the command line as:

```bash
cd pagerts
npm install
pagerts -h
```

To run the application

```bash
npm start -- https?://...
```

## Output

The output encodes a dependency list of resources. It is parsed using JSDOM library and returned to the user as an object annotated with fields `title`, `url`, `resources`.

The last field represents a list of tuples, mapping name of the resource to a url.

The name is extracted from the readable text on the page.

## Installing

The CLI can be installed using:

```bash
cd pagerts
git pull
npm install -g ./
```

It will be made available as a system-wide application under the name of `pagerts`

