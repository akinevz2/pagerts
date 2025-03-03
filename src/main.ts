import Commander from "commander";

import { description, name, version } from '../package.json';
import { PageExtractor } from "./extractors/PageExtractor";
import { ResourceExtractor } from "./extractors/ResourceExtractor";
import { PageFetcher } from "./page/PageFetcher";
import { JSONStylePrinter } from "./printers/JSONStylePrinter";

const program = new Commander.Command();

const url = Commander.createArgument("<url|file...>", "remote URL or local file to extract remote resources from");

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
      const pagesFetched = await pageFetcher.fetchAll(urls);
      for (const page of pagesFetched) {
        const resources = await resourceExtractor.extract(page);
        const pageDescriptor = await pageExtractor.extract(page);
        const pageMetadata = {
          ...pageDescriptor, resources
        }
        await printer.print(pageMetadata);
      }
    })
    .parseAsync(process.argv);
})();
