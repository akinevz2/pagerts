import type { JSDOM } from 'jsdom';

import { PageExtractor } from './extractors/PageExtractor.js';
import { ResourceExtractor } from './extractors/ResourceExtractor.js';
import { AllResourceExtractor } from './extractors/AllResourceExtractor.js';
import { PageFetcher, type PageResponse } from './page/PageFetcher.js';
import type { PageMetadata } from './page/Page.js';
import { JSONStylePrinter } from './printers/JSONStylePrinter.js';
import { LogStylePrinter } from './printers/LogStylePrinter.js';
import type { AbstractResourcePrinter } from './printers/AbstractResourcePrinter.js';
import { DEFAULT_EXTRACTABLE_TAGS, type External, type Resource, type Tag } from './resource.js';

const JSON_OUTPUT = true;

const createPrinter = (json: boolean): AbstractResourcePrinter =>
  json ? new JSONStylePrinter() : new LogStylePrinter();

type ResourceSource = { extract(content: JSDOM): Promise<External<Resource>[]> };

const collectPageMetadatas = async (
  urls: string[],
  timeoutMs: number | undefined,
  resourceSource: ResourceSource
): Promise<PageMetadata[]> => {
  const pageResponses = await new PageFetcher(timeoutMs).fetchAll(urls);
  const pageExtractor = new PageExtractor();
  const pageMetadatas: PageMetadata[] = [];

  for (const { content, url, error } of pageResponses) {
    if (error) {
      pageMetadatas.push({ error });
      continue;
    }
    if (!content) {
      pageMetadatas.push({ error: `empty content for url: ${url}` });
      continue;
    }
    pageMetadatas.push({
      ...(await pageExtractor.extract(content)),
      resources: await resourceSource.extract(content),
    });
  }

  return pageMetadatas;
};

export function printDryRun(
  urls: string[],
  tags: readonly string[],
  properties: readonly string[],
  json: boolean
): void {
  const result = { urls, tags, properties };
  if (json) {
    console.log(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  console.log(
    `URLs:\n${urls.map((url) => `  ${url}`).join('\n') || '  (none)'}\n` +
      `Tags:\n${tags.map((tag) => `  ${tag}`).join('\n') || '  (all document elements)'}\n` +
      `Link properties:\n${properties.map((property) => `  ${property}`).join('\n')}\n`
  );
}

export async function run(
  urls: string[],
  tags: Tag[] = DEFAULT_EXTRACTABLE_TAGS,
  json = JSON_OUTPUT,
  linkProperties?: string[],
  timeoutMs?: number
): Promise<void> {
  const pages = await collectPageMetadatas(
    urls,
    timeoutMs,
    new ResourceExtractor(tags, linkProperties)
  );
  await createPrinter(json).print(...pages);
}

export async function runAll(
  urls: string[],
  tags: Tag[] = [],
  json = JSON_OUTPUT,
  linkProperties?: string[],
  timeoutMs?: number
): Promise<void> {
  const pages = await collectPageMetadatas(
    urls,
    timeoutMs,
    new AllResourceExtractor(linkProperties)
  );
  await createPrinter(json).print(...pages);
}
