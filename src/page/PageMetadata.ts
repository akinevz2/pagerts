import type { ExternalResource } from "../resource";
import type { PageResponse } from "./PageFetcher";

type hasTitle = {
    title: string;
};

type hasUrl = {
    url: string;
};

export type PageDescriptor = hasTitle & hasUrl 

export type PageMetadata = {
    resources: ExternalResource[];
} 

export type Page = (PageDescriptor & PageMetadata) | {
    error: Error
}

export const isPage = (page: any): page is Page => 
  "resources" in page && Array.isArray(page.resources);
