import type { ExternalResource } from '../resource.js';

type hasTitle = {
  title: string;
};

type hasUrl = {
  url: string;
};

type hasResources = {
  resources: ExternalResource[];
};

export type Page = hasTitle & hasUrl;

export type PageSuccess = Page & hasResources;
export type PageFailure = hasUrl & hasResources & { error: string };
export type PageMetadata = PageSuccess | PageFailure;

export const isError = (page: PageMetadata): page is PageFailure => 'error' in page;

export const isPage = (page: PageMetadata): page is PageSuccess =>
  'title' in page && typeof page.title === 'string' && Array.isArray(page.resources);
