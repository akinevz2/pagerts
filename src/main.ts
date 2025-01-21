import Commander from "commander";
import puppetteer from "puppeteer";
import PageExtractor from "./PageExtractor";
import { PageFetcher } from "./PageFetcher";

const program = new Commander.Command();

const url = Commander.createArgument("<url|file...>", "remote URL or local file to extract remote resources from");

// const fetch = Commander.createOption("-f, --fetch", "download and parse all remote resources from a web page");
// const extract = Commander.createOption("-e, --extract", "extract all remote resources from the web page");

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
      console.log("Extracting resources from:", urls.join(", "))
      const browser = await puppetteer.launch({
        headless: true,
        args: ["--no-sandbox"]
      })
      const extractor = new PageExtractor('a', 'img', 'script')
      const pageFetcher = new PageFetcher(browser)
      const pages = await Promise.all(urls.map(u => pageFetcher.fetchPage(u)))
      const resources = await Promise.all(pages.map(p => extractor.executePlugins(p)))
      console.log("Extracted resources:", resources.join(", "))
      browser.close();
    })
    .parseAsync(process.argv);
})();
