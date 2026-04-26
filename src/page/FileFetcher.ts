import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';

import type { DOMResult } from './PageFetcher.js';

export const MAX_FILES_FAILSAFE = 254;

type ParseHTMLResult = {
  document: Document;
};

export interface FileResponse {
  path: string;
  content?: DOMResult;
  error?: string;
}

export class FileFetcher {
  private buildDOMResult(html: string, filePath: string): DOMResult {
    const { document } = parseHTML(html) as ParseHTMLResult;
    return { window: { document }, url: `file://${filePath}` };
  }

  async fetchFile(filePath: string): Promise<FileResponse> {
    try {
      // filePath is supplied directly by the CLI user, not derived from network input.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const html = await readFile(filePath, 'utf-8');
      return { path: filePath, content: this.buildDOMResult(html, filePath) };
    } catch (error) {
      return {
        path: filePath,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async fetchAll(filePaths: string[]): Promise<FileResponse[]> {
    return Promise.all(filePaths.map((p) => this.fetchFile(p)));
  }
}
