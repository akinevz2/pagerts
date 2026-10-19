#!/usr/bin/env node
import { Command, createArgument, createOption } from '@commander-js/extra-typings';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { PageExtractor } from './extractors/PageExtractor.js';
import { ResourceExtractor } from './extractors/ResourceExtractor.js';
import { AllResourceExtractor } from './extractors/AllResourceExtractor.js';
import { PageFetcher } from './page/PageFetcher.js';
import type { PageMetadata } from './page/Page.js';
import { JSONStylePrinter } from './printers/JSONStylePrinter.js';
import { LogStylePrinter } from './printers/LogStylePrinter.js';
import type { AbstractResourcePrinter } from './printers/AbstractResourcePrinter.js';
import { DEFAULT_EXTRACTABLE_TAGS, DEFAULT_RESOURCE_LINK_KEYS, type Tag } from './resource.js';

const { description, name, version }: { description: string; name: string; version: string } =
  createRequire(import.meta.url)('../package.json');

const createTagsOption = () =>
  createOption(
    '-t, --tags <tags>',
    'search only these HTML tags, comma-separated or repeated (e.g. a,img)'
  ).argParser((value: string, previous: Tag[] = []): Tag[] => [
    ...previous,
    ...(value
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean) as Tag[]),
  ]);

const createJsonOption = () => createOption('--json', 'output as JSON');

const createPropertiesOption = () =>
  createOption(
    '-p, --properties <properties>',
    'additional link properties to search; comma-separated or repeated'
  ).argParser((value: string, previous: string[] = []): string[] => [
    ...previous,
    ...value
      .split(',')
      .map((property) => property.trim())
      .filter(Boolean),
  ]);

const createDryRunOption = () =>
  createOption('--dry-run', 'print the effective URLs, tags, and link properties without fetching');

const createPrinter = (json: boolean): AbstractResourcePrinter =>
  json ? new JSONStylePrinter() : new LogStylePrinter();

export function printDryRun(
  urls: string[],
  tags: readonly string[],
  properties: readonly string[],
  json: boolean
): void {
  const result = { urls, tags, properties };
  if (json) {
    console.log(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  console.log(
    `URLs:\n${urls.map((url) => `  ${url}`).join('\n') || '  (none)'}\n` +
    `Tags:\n${tags.map((tag) => `  ${tag}`).join('\n') || '  (all document elements)'}\n` +
    `Link properties:\n${properties.map((property) => `  ${property}`).join('\n')}\n`
  );
}

export async function run(
  urls: string[],
  tags: Tag[] = DEFAULT_EXTRACTABLE_TAGS,
  json = false,
  linkProperties?: string[]
): Promise<void> {
  const printer = createPrinter(json);
  const pageFetcher = new PageFetcher();
  const pageExtractor = new PageExtractor();
  const resourceExtractor = new ResourceExtractor(tags, linkProperties);

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

export async function runAll(
  urls: string[],
  tags: Tag[] = [],
  json = false,
  linkProperties?: string[]
): Promise<void> {
  const printer = createPrinter(json);
  const pageFetcher = new PageFetcher();
  const pageExtractor = new PageExtractor();
  const resourceExtractor = new AllResourceExtractor(linkProperties);

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

function makeProgram() {
  const cli = new Command().name(name).version(version, '-v, --version').description(description);
  const capture = (signals: Map<string, unknown>, key: string) => (value: unknown) =>
    signals.set(key, value);
  const rootSignals = new Map<string, unknown>();
  cli
    .addOption(createJsonOption())
    .addOption(createTagsOption())
    .addOption(createPropertiesOption())
    .addOption(createDryRunOption());
  cli.on('option:json', capture(rootSignals, 'json'));
  cli.on('option:tags', capture(rootSignals, 'tags'));
  cli.on('option:properties', capture(rootSignals, 'properties'));
  cli.on('option:dry-run', capture(rootSignals, 'dryRun'));
  cli.hook('preAction', () => {
    for (const [key, value] of Object.entries(cli.opts())) {
      rootSignals.set(key, value);
    }
  });

  const all = cli
    .command('all')
    .description('search all elements in each document for link properties')
    .addArgument(createArgument('<urls...>', 'URLs or file paths to extract from'))
    .option('--json', 'output as JSON')
    .option('-p, --properties <properties>', 'additional link properties')
    .option('--dry-run', 'print the effective URLs and link properties without fetching');
  const allSignals = new Map<string, unknown>();
  all.hook('preAction', () => {
    const options = all.opts();
    Object.entries(options).forEach(([key, value]) => allSignals.set(key, value));
  });
  all.action(async (urls) => {
    const { dryRun, properties, json } = {
      ...Object.fromEntries(rootSignals),
      ...Object.fromEntries(allSignals),
    } as {
      dryRun?: boolean;
      properties?: string | string[];
      json?: boolean;
    };
    const additionalProperties = Array.isArray(properties)
      ? properties
      : (properties ?? '')
        .split(',')
        .map((property) => property.trim())
        .filter(Boolean);
    const linkProperties = [...new Set([...DEFAULT_RESOURCE_LINK_KEYS, ...additionalProperties])];
    if (dryRun) {
      printDryRun(urls, ['*'], linkProperties, json ?? false);
      return;
    }
    await runAll(urls, [], json, linkProperties);
  });

  cli.addArgument(
    createArgument(
      '<urls...>',
      'URLs or file paths to extract from: accepts http://, https://, and local file paths'
    )
  );
  cli.action(async (urls, _options) => {
    const { tags, properties, json, dryRun } = Object.fromEntries(rootSignals) as {
      tags?: Tag[];
      properties?: string[];
      json?: boolean;
      dryRun?: boolean;
    };
    const linkProperties = [...new Set([...DEFAULT_RESOURCE_LINK_KEYS, ...(properties ?? [])])];
    const selectedTags = tags?.length ? tags : DEFAULT_EXTRACTABLE_TAGS;
    if (dryRun) {
      printDryRun(_options.args, selectedTags, linkProperties, json ?? false);
      return;
    }
    await run(_options.args, selectedTags, json, linkProperties);
  });

  return cli;
}

async function pagerts(): Promise<void> {
  await makeProgram().parseAsync(process.argv);
}

await pagerts();
