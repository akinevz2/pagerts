#!/usr/bin/env node
import { Command, createArgument } from "commander";

import { description, name, version } from '../package.json';
import { PageExtractor } from "./extractors/PageExtractor";
import { ResourceExtractor } from "./extractors/ResourceExtractor";
import { isJSDOM, PageFetcher, type PageResponse } from "./page/PageFetcher";
import type { Page, PageMetadata } from "./page/Page";
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

      const pageFetcher = new PageFetcher()
      const pageExtractor = new PageExtractor()
      const resourceExtractor = new ResourceExtractor(["a", "meta", "link", "embed"])

      const pageResponses: PageResponse[] = await pageFetcher.fetchAll(urls);
      const pageMetadatas: PageMetadata[] = []
      for (const page of pageResponses) {
        // check if page has an error
        if (isJSDOM(page)) {
          const resources = await resourceExtractor.extract(page);
          const descriptor = await pageExtractor.extract(page);
          pageMetadatas.push({
            ...descriptor, resources
          });
        } else pageMetadatas.push({
            ...page, resources: []
          });
      }
      await printer.print(...pageMetadatas);
    })
    .parseAsync(process.argv);
})();
