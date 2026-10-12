#!/usr/bin/env node
import { createArgument, program, createOption } from '@commander-js/extra-typings';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { PageExtractor } from './extractors/PageExtractor.js';
import { ResourceExtractor } from './extractors/ResourceExtractor.js';
import { PageFetcher } from './page/PageFetcher.js';
import type { PageMetadata } from './page/Page.js';
import { JSONStylePrinter } from './printers/JSONStylePrinter.js';
import { LogStylePrinter } from './printers/LogStylePrinter.js';
import type { AbstractResourcePrinter } from './printers/AbstractResourcePrinter.js';
import type { Tag } from './resource.js';

const { description, name, version }: { description: string; name: string; version: string } =
  createRequire(import.meta.url)('../package.json');

const targets = createArgument(
  '<targets...>',
  'remote https://URL or local file://resource.html to extract from, optionally followed by tag names (e.g. a img) to restrict extraction to'
);

const createPrinter = (json: boolean): AbstractResourcePrinter =>
  json ? new JSONStylePrinter() : new LogStylePrinter();

/** URLs always contain a scheme separator; anything after them without one is a tag name. */
export function splitTargets(args: string[]): { urls: string[]; tags: Tag[] } {
  const urls = args.filter((arg) => arg.includes(':'));
  const tags = args.filter((arg) => !arg.includes(':')) as Tag[];
  return { urls, tags };
}

export async function run(urls: string[], tags: Tag[] = [], json = true): Promise<void> {
  const printer = createPrinter(json);
  const pageFetcher = new PageFetcher();
  const pageExtractor = new PageExtractor();
  const resourceExtractor = new ResourceExtractor(tags);

  const pageResponses = await pageFetcher.fetchAll(urls);
  const pageMetadatas: PageMetadata[] = [];

  for (const { content, url, error } of pageResponses) {
    if (error) {
      pageMetadatas.push({ error });
      continue;
    }
    if (!content) {
      pageMetadatas.push({ error: `empty content for url: ${url}` });
      continue;
    }

    const resources = await resourceExtractor.extract(content);
    const descriptor = await pageExtractor.extract(content);
    pageMetadatas.push({ ...descriptor, resources });
  }

  await printer.print(...pageMetadatas);
}

async function pagerts(): Promise<void> {
  await program
    .name(name)
    .version(version, '-v, --version')
    .description(description)
    .option('--no-json', 'print a human-readable log instead of JSON')
    .addArgument(targets)
    .action(async (args, { json }) => {
      const { urls, tags } = splitTargets(args);
      await run(urls, tags, json);
    })
    .parseAsync(process.argv);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await pagerts();
}
