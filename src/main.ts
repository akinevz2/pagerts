#!/usr/bin/env node
import { Command, createArgument, Option } from 'commander';

import pkg from '../package.json' with { type: 'json' };
import { PageExtractor, ResourceExtractor } from './extractors/index.js';
import { PageFetcher, type PageMetadata } from './page/index.js';
import { JSONStylePrinter } from './printers/index.js';
import { validateUrls } from './security.js';

const { description, name, version } = pkg;

const program = new Command();

const url = createArgument(
  '<url | file...>',
  'remote https://URL or local file://resource.html to extract from'
);

(async (): Promise<void> => {
  await program
    .name(name)
    .version(version, '-v, --version')
    .description(description)
    .addArgument(url)
    .addOption(new Option('--js', 'execute page scripts (allows JS-loaded elements; use only on trusted pages)').conflicts('watch'))
    .addOption(new Option('--watch', 'keep running: SIGWINCH re-fetches after resize, Ctrl-D releases in-flight requests, Ctrl-C exits').conflicts('js'))
    .action(async (urls: string[], options: { js: boolean; watch: boolean }) => {
      try {
        // Validate URLs first
        const { validUrls, errors } = validateUrls(urls);

        // Report validation errors
        if (errors.length > 0) {
          console.error('\n❌ URL Validation Errors:');
          errors.forEach(({ url: invalidUrl, error }) => {
            console.error(`  - ${invalidUrl}: ${error}`);
          });
        }

        // Exit if no valid URLs
        if (validUrls.length === 0) {
          console.error('\n❌ No valid URLs to process. Exiting.');
          process.exit(1);
        }

        console.error(`\n✅ Processing ${validUrls.length} valid URL(s)...`);

        const printer = new JSONStylePrinter();
        // watch mode is unbounded (timeout=0); default mode uses 10s timeout
        const pageFetcher = new PageFetcher(options.watch ? 0 : 10000, 2, options.js);
        const pageExtractor = new PageExtractor();
        const resourceExtractor = new ResourceExtractor(['a', 'meta', 'link', 'embed', 'script']);

        const execute = async (): Promise<void> => {
          const pageResponses = await pageFetcher.fetchAll(validUrls);
          const pageMetadatas: PageMetadata[] = [];

          for (const { content, url: responseUrl, error } of pageResponses) {
            const resources =
              error !== undefined || !content ? [] : await resourceExtractor.extract(content);
            const descriptor =
              error !== undefined || !content
                ? { url: responseUrl, error: error ?? 'Unknown error', resources }
                : await pageExtractor.extract(content);
            pageMetadatas.push({ ...descriptor, resources });

            if (options.js && error === undefined && content && 'title' in descriptor) {
              const looksLikeSpa = !descriptor.title && resources.length === 0;
              if (looksLikeSpa) {
                process.stderr.write(
                  `⚠️  ${responseUrl}: empty result with --js — page may be a client-side SPA whose bundles aren't loaded by jsdom. Consider a headless browser instead.\n`
                );
              }
            }
          }

          await printer.print(...pageMetadatas);
        };

        if (options.watch) {
          process.stdin.resume();

          process.on('SIGINT', () => {
            process.exit(0);
          });

          let activeExecution: Promise<void> | null = null;

          process.stdin.on('end', () => {
            // Ctrl-D: detach in-flight requests and let them fly off
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
    })
    .parseAsync(process.argv);
})();
