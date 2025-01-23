import Commander from "commander";
import PageExtractor from "./PageExtractor";
import { PageFetcher } from "./PageFetcher";
import { LogStylePagePrinter as PagePrinter } from './PagePrinter';

const program = new Commander.Command();

const url = Commander.createArgument("<url|file...>", "remote URL or local file to extract remote resources from");

(async () => {
  const package_json = (await import("../package.json")).default;

  const program_name = package_json.name;
  const program_version = package_json.version;
  const program_description = package_json.description;


  await program
    .name(program_name)
    .version(program_version, "-v, --version")
    .description(program_description)
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
