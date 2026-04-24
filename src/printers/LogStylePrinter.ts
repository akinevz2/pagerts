import { isPage, type PageMetadata } from '../page/index.js';
import { AbstractResourcePrinter } from './AbstractResourcePrinter.js';

export class LogStylePrinter extends AbstractResourcePrinter {
  write(str: string): void {
    process.stdout.write(str);
  }

  async print(...pages: PageMetadata[]): Promise<void> {
    for (const page of pages) {
      if (!isPage(page)) {
        this.write(page.error);
        continue;
      }

      const { resources, title, url } = page;

      this.write(`Title: ${title}\n`);
      this.write(`URL: ${url}\n\n`);

      for (const resource of resources) {
        const {
          link: { value: url },
          text: { value },
        } = resource;
        this.write(`${value}: ${url}\n`);
      }
    }
  }
}
