#!/usr/bin/env node
import { Command, createArgument, Option } from 'commander';
import { createRequire } from 'node:module';

import { PageExtractor, ResourceExtractor } from './extractors/index.js';
import { FileFetcher, MAX_FILES_FAILSAFE, PageFetcher, type PageMetadata } from './page/index.js';
import { JSONStylePrinter } from './printers/index.js';
import { validateUrls } from './security.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as {
  description: string;
  name: string;
  version: string;
};

const { description, name, version } = pkg;

const program = new Command();

const urlArg = createArgument('<url...>', 'remote https://URL to extract from');
const fileArg = createArgument('<paths...>', 'local file paths to extract from');

// Shared extractor instances.
const pageExtractor = new PageExtractor();
const resourceExtractor = new ResourceExtractor(['a', 'meta', 'link', 'embed', 'script']);
const printer = new JSONStylePrinter();

async function buildPageMetadata(
  responses: Array<{
    url?: string;
    path?: string;
    content?: import('./page/index.js').DOMResult;
    error?: string;
  }>
): Promise<PageMetadata[]> {
  const pageMetadatas: PageMetadata[] = [];

  for (const { content, url: responseUrl, path, error } of responses) {
    const resolvedUrl = responseUrl ?? path ?? '';
    const resources =
      error !== undefined || !content ? [] : await resourceExtractor.extract(content);
    const descriptor =
      error !== undefined || !content
        ? { url: resolvedUrl, error: error ?? 'Unknown error', resources }
        : await pageExtractor.extract(content);
    pageMetadatas.push({ ...descriptor, resources });
  }

  return pageMetadatas;
}

(async (): Promise<void> => {
  program.name(name).version(version, '-v, --version').description(description);

  // ── fetch subcommand (default remote URL mode) ──────────────────────────
  program
    .command('fetch', { isDefault: true })
    .description('fetch and extract resources from remote URL(s)')
    .addArgument(urlArg)
    .addOption(
      new Option(
        '--watch',
        'keep running: SIGWINCH re-fetches after resize, Ctrl-D releases in-flight requests, Ctrl-C exits'
      )
    )
    .action(async (urls: string[], options: { watch: boolean }) => {
      try {
        const { validUrls, errors } = validateUrls(urls);

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

        const pageFetcher = new PageFetcher(options.watch ? 0 : 10000, 2);

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
                console.error('\n❌ An error occurred:', err instanceof Error ? err.message : err);
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
    });

  // ── file subcommand (local filesystem access) ────────────────────────────
  program
    .command('file')
    .description('extract resources from local file(s) via direct filesystem access')
    .addArgument(fileArg)
    .addOption(
      new Option('--no-failsafe', `bypass the ${MAX_FILES_FAILSAFE}-file limit safety check`)
    )
    .action(async (paths: string[], options: { failsafe: boolean }) => {
      try {
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
        const responses = await fileFetcher.fetchAll(paths);
        const pageMetadatas = await buildPageMetadata(
          responses.map(({ path, content, error }) => ({ path, content, error }))
        );

        await printer.print(...pageMetadatas);
      } catch (error) {
        console.error('\n❌ An error occurred:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
})();
