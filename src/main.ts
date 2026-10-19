#!/usr/bin/env node
import {
  Command,
  createArgument,
  createOption,
  InvalidArgumentError,
} from '@commander-js/extra-typings';
import { createRequire } from 'node:module';

import type { Tag } from './resource.js';
import { DEFAULT_EXTRACTABLE_TAGS, DEFAULT_RESOURCE_LINK_KEYS } from './resource.js';
import { printDryRun, run, runAll } from './lib.js';

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

const createNoJsonOption = () => createOption('--no-json', 'output in human-readable format');

const createPropertiesOption = () =>
  createOption(
    '-p, --properties <properties>',
    'additional link tag properties to search; comma-separated or repeated'
  ).argParser((value: string, previous: string[] = []): string[] => [
    ...previous,
    ...value
      .split(',')
      .map((property) => property.trim())
      .filter(Boolean),
  ]);

const createDryRunOption = () =>
  createOption(
    '--dry-run',
    'print the effective URLs, tags, and link tag properties without fetching'
  );

const createTimeoutOption = () =>
  createOption(
    '--timeout <ms>',
    'abort each network fetch after this many milliseconds; defaults to no timeout'
  ).argParser((value: string): number => {
    const milliseconds = Number(value);
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
      throw new InvalidArgumentError('expected a positive number of milliseconds');
    }
    return milliseconds;
  });

const flush = (stream: NodeJS.WriteStream): Promise<void> =>
  new Promise((resolve) => stream.write('', () => resolve()));

function makeProgram() {
  const cli = new Command()
    .name(name)
    .version(version, '-v, --version')
    .description(description)
    .exitOverride();
  const capture = (signals: Map<string, unknown>, key: string) => (value: unknown) =>
    signals.set(key, value);
  const rootSignals = new Map<string, unknown>();
  cli
    .addOption(createNoJsonOption())
    .addOption(createTagsOption())
    .addOption(createPropertiesOption())
    .addOption(createDryRunOption())
    .addOption(createTimeoutOption());
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
    .option('-p, --properties <properties>', 'additional link properties')
    .option('--dry-run', 'print the effective URLs and link properties without fetching');
  const allSignals = new Map<string, unknown>();
  all.hook('preAction', () => {
    const options = all.opts();
    Object.entries(options).forEach(([key, value]) => allSignals.set(key, value));
  });
  all.action(async (urls) => {
    const { dryRun, properties, json, timeout } = {
      ...Object.fromEntries(rootSignals),
      ...Object.fromEntries(allSignals),
    } as {
      dryRun?: boolean;
      properties?: string | string[];
      json?: boolean;
      timeout?: number;
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
    await runAll(urls, [], json, linkProperties, timeout);
  });

  cli.addArgument(
    createArgument(
      '<urls...>',
      'URLs or file paths to extract from: accepts http://, https://, and local file paths'
    )
  );
  cli.action(async (urls) => {
    const { tags, properties, json, dryRun, timeout } = Object.fromEntries(rootSignals) as {
      tags?: Tag[];
      properties?: string[];
      json?: boolean;
      dryRun?: boolean;
      timeout?: number;
    };
    const linkProperties = [...new Set([...DEFAULT_RESOURCE_LINK_KEYS, ...(properties ?? [])])];
    const selectedTags = tags?.length ? tags : DEFAULT_EXTRACTABLE_TAGS;
    if (dryRun) {
      printDryRun(urls as string[], selectedTags, linkProperties, json ?? false);
      return;
    }
    await run(urls as string[], selectedTags, json, linkProperties, timeout);
  });

  return cli;
}

async function pagerts(): Promise<void> {
  const cli = makeProgram();
  try {
    await cli.parseAsync(process.argv);
    // Forced exit: an aborted (timed out) fetch leaves a socket pending in
    // jsdom that would keep the process alive after the output is printed.
    await flush(process.stdout);
    process.exit(process.exitCode ?? 0);
  } catch (error) {
    const code = (error as { code?: string }).code;
    const exitCode = (error as { exitCode?: number }).exitCode;
    if (typeof code === 'string' && code.startsWith('commander.')) {
      // Commander already printed its own message (usage errors, help, version)
      process.exit(exitCode ?? 1);
    }
    const message = error instanceof Error ? error.message : String(error);
    if (process.argv.includes('--no-json')) {
      console.error(`Error: ${message}`);
    } else {
      console.error(JSON.stringify({ error: message }));
    }
    process.exit(1);
  }
}

await pagerts();
