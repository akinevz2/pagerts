import type { PageMetadata } from '../page/index.js';
import { AbstractResourcePrinter } from './AbstractResourcePrinter.js';

export class JSONStylePrinter extends AbstractResourcePrinter {
  print(...pages: PageMetadata[]): void | Promise<void> {
    const json = JSON.stringify(pages);
    process.stdout.write(json + '\n');
  }
}
