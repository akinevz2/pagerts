import type { ExternalResource } from "../resource";

type hasTitle = {
    title: string;
};

type hasUrl = {
    url: string;
};

export type PageDescriptor = hasTitle & hasUrl;

export type PageMetadata = {
    resources: ExternalResource[];
} & PageDescriptor;