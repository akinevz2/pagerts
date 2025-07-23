#!/usr/bin/env node
import { Command, createArgument } from "commander";

import { description, name, version } from '../package.json';
import { PageExtractor } from "./extractors/PageExtractor";
import { ResourceExtractor } from "./extractors/ResourceExtractor";
import { PageFetcher } from "./page/PageFetcher";
import type { Page, PageMetadata } from "./page/Page";
import { JSONStylePrinter } from "./printers/JSONStylePrinter";
import { LogStylePrinter } from "./printers/LogStylePrinter";

const program = new Command();

const url = createArgument("<url | file...>", "remote https://URL or local file://resource.html to extract from");

(async () => {
  await program
    .name(name)
    .version(version, "-v, --version")
    .description(description)
    .addArgument(url)
    .action(async (urls: string[]) => {
      const printer = new JSONStylePrinter();
      // simple log style printer
      // const printer = new LogStylePrinter();

      const pageFetcher = new PageFetcher()
      const pageExtractor = new PageExtractor()
      const resourceExtractor = new ResourceExtractor(["a", "meta", "link", "embed"])

      const pageResponses = await pageFetcher.fetchAll(urls);
      const pageMetadatas: PageMetadata[] = [];

      for (const { content, url, error } of pageResponses) {
        const resources = error in (content) ? [] : await resourceExtractor.extract(content);
        const descriptor = error in content ? { url, error } : await pageExtractor.extract(content);
        pageMetadatas.push({ ...descriptor, resources });
      }

      await printer.print(...pageMetadatas);
    })
    .parseAsync(process.argv);
})();
