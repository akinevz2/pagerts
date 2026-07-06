import { isPage, type PageMetadata } from '../page/index.js';
import { AbstractResourcePrinter } from './AbstractResourcePrinter.js';

export class LogStylePrinter extends AbstractResourcePrinter {
  private sanitizeForTerminal(value: string): string {
    return Array.from(value)
      .filter((char) => {
        const codePoint = char.codePointAt(0) ?? 0;
        const isControl =
          (codePoint >= 0 && codePoint <= 31) || (codePoint >= 127 && codePoint <= 159);
        return !isControl;
      })
      .join('');
  }

  write(str: string): void {
    process.stdout.write(str);
  }

  async print(...pages: PageMetadata[]): Promise<void> {
    for (const page of pages) {
      if (!isPage(page)) {
        this.write(this.sanitizeForTerminal(page.error));
        continue;
      }

      const { resources, title, url } = page;

      this.write(`Title: ${this.sanitizeForTerminal(title)}\n`);
      this.write(`URL: ${this.sanitizeForTerminal(url)}\n\n`);

      for (const resource of resources) {
        const {
          link: { value: url },
          text: { value },
        } = resource;
        this.write(`${this.sanitizeForTerminal(value)}: ${this.sanitizeForTerminal(url)}\n`);
      }
    }
  }
}
