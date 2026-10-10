#!/usr/bin/env node
import { Command, createArgument, createOption, Option } from 'commander';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

import { PageExtractor, ResourceExtractor } from './extractors/index.js';
import { FileFetcher, MAX_FILES_FAILSAFE, PageFetcher, type DOMResult, type PageMetadata } from './page/index.js';
import { JSONStylePrinter } from './printers/index.js';
import { validateUrls } from './security.js';

import { description, name, version } from '../package.json';

const pagerts = new Command();

const targets = createArgument('<uri...>', 'remote URLs or local file URIs');
const printerOption = createOption('--printer', 'log|json|plain', {
  defaultOption: true,
});

// Shared extractor instances.
const pageExtractor = new PageExtractor();
const resourceExtractor = new ResourceExtractor(['a', 'meta', 'link', 'embed', 'script']);

function buildPrinter(printerType: string): import('./printers/index').AbstractResourcePrinter {
  return import('./printers/index').PrinterFactory.createPrinter(
    printerType as import('./printers/index').PrinterType
  );
}

async function buildPageMetadata(
  responses: Array<{
  }>
): Promise<PageMetadata[]> {

  return responses.map(({ content, url: responseUrl, path, error }) => {

    // Happy path: extract resources and page metadata
    const resources = await resourceExtractor.extract(
      content.window.document.documentElement.outerHTML
    );
    const descriptor = await pageExtractor.extract(content);
    if (error) {

    }
  })

}

function normalizeLocalPath(value: string): string {
  if (value.startsWith('file://')) {
    return fileURLToPath(value);
  }

  return value;
}

async function runFileCommand(paths: string[], options: { failsafe: boolean }): Promise<void> {
  if (options.failsafe && paths.length > MAX_FILES_FAILSAFE) {
    console.error(
      `\n❌ ${paths.length} files specified exceeds the safety limit of ${MAX_FILES_FAILSAFE}.`
    );
    console.error(`   Pass --no-failsafe to bypass this check and process all files.`);
    process.exit(1);
  }

  if (!options.failsafe && paths.length > MAX_FILES_FAILSAFE) {
    console.error(
      `\n⚠️  Failsafe bypassed: processing ${paths.length} files (limit is ${MAX_FILES_FAILSAFE}).`
    );
  }

  console.error(`\n✅ Processing ${paths.length} file(s)...`);

  const fileFetcher = new FileFetcher();
  const normalizedPaths = paths.map((pathValue) => normalizeLocalPath(pathValue));
  const responses = await fileFetcher.fetchAll(normalizedPaths);
  const pageMetadatas = await buildPageMetadata(
    responses.map(({ path, content, error }) => ({ path, content, error }))
  );

  await printer.print(...pageMetadatas);
}

function isCliEntrypoint(): boolean {
  const invokedPath = process.argv[1];
  if (!invokedPath) {
    return false;
  }

  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(invokedPath));
  } catch {
    return false;
  }
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  pagerts.name(name).version(version, '-v, --version').description(description);

  pagerts
    .addArgument(fileArg)
    .addOption(
      new Option('--no-failsafe', `bypass the ${MAX_FILES_FAILSAFE}-file limit safety check`)
    )
    .action(async (paths: string[], options: { failsafe: boolean }) => {
      try {
        await runFileCommand(paths, options);
      } catch (error) {
        console.error('\n❌ An error occurred:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // ── fetch subcommand (remote URL mode only) ─────────────────────────────
  pagerts
    .command('fetch')
    .description('fetch and extract resources from remote URL(s)')
    .addArgument(targets)
    .addOption(
      new Option(
        '--watch',
        'keep running: SIGWINCH re-fetches after resize, Ctrl-D releases in-flight requests, Ctrl-C exits'
      )
    )
    .addOption(new Option('-A, --user-agent <value>', 'override the HTTP User-Agent header'))
    .addOption(
      new Option(
        '--allow-private-hosts',
        'allow localhost/private-network targets (disabled by default for SSRF safety)'
      )
    )
    .action(
      async (
        urls: string[],
        options: { watch: boolean; userAgent?: string; allowPrivateHosts: boolean }
      ) => {
        try {
          const { validUrls, errors } = validateUrls(urls, {
            allowPrivateHosts: options.allowPrivateHosts,
          });

          if (errors.length > 0) {
            console.error('\n❌ URL Validation Errors:');
            errors.forEach(({ url: invalidUrl, error }) => {
              console.error(`  - ${invalidUrl}: ${error}`);
            });
          }

          if (validUrls.length === 0) {
            console.error('\n❌ No valid URLs to process. Exiting.');
            process.exit(1);
          }

          console.error(`\n✅ Processing ${validUrls.length} valid URL(s)...`);

          const pageFetcher = new PageFetcher(
            options.watch ? 0 : 10000,
            2,
            options.userAgent,
            options.allowPrivateHosts
          );

          const execute = async (): Promise<void> => {
            const responses = await pageFetcher.fetchAll(validUrls);
            const pageMetadatas = await buildPageMetadata(responses);
            await printer.print(...pageMetadatas);
          };

          if (options.watch) {
            process.stdin.resume();
            process.on('SIGINT', () => process.exit(0));

            let activeExecution: Promise<void> | null = null;
            process.stdin.on('end', () => {
              activeExecution = null;
            });

            let winchTimer: ReturnType<typeof setTimeout> | null = null;
            process.on('SIGWINCH', () => {
              if (winchTimer !== null) clearTimeout(winchTimer);
              winchTimer = setTimeout(() => {
                winchTimer = null;
                activeExecution = execute().catch((err: unknown) => {
                  console.error(
                    '\n❌ An error occurred:',
                    err instanceof Error ? err.message : err
                  );
                });
              }, 150);
            });

            activeExecution = execute();
            await activeExecution;
          } else {
            await execute();
          }
        } catch (error) {
          console.error('\n❌ An error occurred:', error instanceof Error ? error.message : error);
          process.exit(1);
        }
      }
    );

  // ── file subcommand (local filesystem access) ────────────────────────────
  pagerts
    .command('file')
    .description('extract resources from local file(s) via direct filesystem access')
    .addArgument(fileArg)
    .addOption(
      new Option('--no-failsafe', `bypass the ${MAX_FILES_FAILSAFE}-file limit safety check`)
    )
    .action(async (paths: string[], options: { failsafe: boolean }) => {
      try {
        await runFileCommand(paths, options);
      } catch (error) {
        console.error('\n❌ An error occurred:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  await pagerts.parseAsync(argv);
}

if (isCliEntrypoint()) {
  runCli().catch((error: unknown) => {
    console.error('\n❌ An error occurred:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
