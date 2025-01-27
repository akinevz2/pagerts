import { Resource, type ResourceKey } from "./tags";

export interface PageContent {
    title: string;
    url: string;
    resources: Resource[];
}
export type ElementDescription = {
    key: ResourceKey;
    url: string;
    text: string;
}
