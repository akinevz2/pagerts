import { isPage, type PageMetadata } from '../page/Page.js';
import { AbstractResourcePrinter } from './AbstractResourcePrinter.js';

export class LogStylePrinter extends AbstractResourcePrinter {
  write(str: string): void {
    console.log(str);
  }

  async print(...pages: PageMetadata[]): Promise<void> {
    for (const page of pages) {
      if (!isPage(page)) {
        this.write(`${page.error}\n`);
        continue;
      }

      const { resources, title, url } = page;

      this.write(`Title: ${title}`);
      this.write(`URL: ${url}\n`);

      for (const resource of resources) {
        const {
          link: { url },
          value,
        } = resource;
        this.write(`${value}: ${url}`);
      }
      this.write('');
    }
  }
}
