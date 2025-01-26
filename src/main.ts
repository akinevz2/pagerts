import Commander from "commander";

import { description, name, version } from '../package.json';
import PageExtractor from "./PageExtractor";
import { PageFetcher } from "./PageFetcher";
import { LogStylePagePrinter as PagePrinter } from './PagePrinter';

const program = new Commander.Command();

const url = Commander.createArgument("<url|file...>", "remote URL or local file to extract remote resources from");

(async () => {
  await program
    .name(name)
    .version(version, "-v, --version")
    .description(description)
    .addArgument(url)
    .action(async (urls: string[]) => {
      console.log("Extracting resources from:", urls)
      const extractor = new PageExtractor('a', 'img', 'script', 'link')

      const pageFetcher = new PageFetcher()
      const pagesFetched = await Promise.all(urls.map(u => pageFetcher.fetchPage(u)))
      const pageContents = await Promise.all(pagesFetched.map(p => extractor.executePlugins(p)))
      const pagePrinter = new PagePrinter(pageContents)
      await pagePrinter.print()
    })
    .parseAsync(process.argv);
})();
