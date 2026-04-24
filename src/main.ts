#!/usr/bin/env node
import { Command, createArgument } from 'commander';

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
    .action(async (urls: string[]) => {
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
        const pageFetcher = new PageFetcher();
        const pageExtractor = new PageExtractor();
        const resourceExtractor = new ResourceExtractor(['a', 'meta', 'link', 'embed']);

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
        }

        await printer.print(...pageMetadatas);
      } catch (error) {
        console.error('\n❌ An error occurred:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    })
    .parseAsync(process.argv);
})();
