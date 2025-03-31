import type { ExternalResource } from "../resource";
import type { PageResponse } from "./PageFetcher";

type hasTitle = {
    title: string;
};

type hasUrl = {
    url: string;
};

type hasResources = {
    resources: ExternalResource[];
};

export type Page = hasTitle & hasUrl
export type PageMetadata = (Page & hasResources) | { error: string }
export const isError = (page: PageMetadata): page is { error: string } => 'error' in page;
export const isPage = (page: any): page is Page =>
    "resources" in page && Array.isArray(page.resources);
