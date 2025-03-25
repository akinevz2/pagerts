#!/usr/bin/env node
import { Command, createArgument } from "commander";

import { description, name, version } from '../package.json';
import { PageExtractor } from "./extractors/PageExtractor";
import { ResourceExtractor } from "./extractors/ResourceExtractor";
import { isJSDOM, PageFetcher, type PageResponse } from "./page/PageFetcher";
import { type Page } from "./page/PageMetadata";
import { JSONStylePrinter } from "./printers/JSONStylePrinter";

const program = new Command();

const url = createArgument("<url|file...>", "remote URL or local file to extract remote resources from");

(async () => {
  await program
    .name(name)
    .version(version, "-v, --version")
    .description(description)
    .addArgument(url)
    .action(async (urls: string[]) => {
      const printer = new JSONStylePrinter();
      try {
        const pageFetcher = new PageFetcher()
        const pageExtractor = new PageExtractor()
        const resourceExtractor = new ResourceExtractor(["a", "meta", "link", "embed"])
        const pagesFetched: PageResponse[] = await pageFetcher.fetchAll(urls);
        const metadataPages: Page[] = []
        for (const page of pagesFetched) {
          // check if page has an error
          if (isJSDOM(page)) {
            const resources = await resourceExtractor.extract(page);
            const descriptor = await pageExtractor.extract(page);
            metadataPages.push({
              ...descriptor, resources
            });
          } else metadataPages.push(page);
        }
        await printer.print(...metadataPages);
      } catch (error) {
        await printer.print({
          error: error.message
        })
      }
    })
    .parseAsync(process.argv);
})();
