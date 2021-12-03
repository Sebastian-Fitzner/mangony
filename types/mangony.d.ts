export type Type<D> = {
    id: string;
    assets: string;
    relativeToBasePath: string;
    ext: string;
    srcExt: string;
    type: 'pages' | 'layouts' | 'partials' | 'commons' | unknown,
    basename: string;
    filename: string;
    dirname: string;
    destDir: string;
    destSubDir: string;
    destFile: string;
    serverFile: string;
    raw: string;
    parsed: {
        content: string;
        data: D;
        isEmpty: boolean;
        excerpt: string;
    }
}

export type Collection = {
    name: string;
    files: string[];
}

export type Root<D> = {
    assets: string;
    currentPage: Type<D>;
    servermode: boolean;
    __repository: Record<string, string[]>;
    __layouts: Record<string, Type<D>>;
    __partials: Record<string, Type<D>>;
    pages: Record<string, Type<D>>;
    collections: Record<string, Record<string, Collection>>;
    [dataKey: string]: unknown;
}

export type PageSettings = {
    contextData?: string;
    layout?: string;
    publish?: boolean;
}

export type ContextVariations<V = ContextVariation> = {
    variations: Record<string, V>
}

export type ContextVariation = {
    variationName: string;
    variationDescription?: string;
    docsSettings?: Record<string, unknown>;
    props: Record<string, unknown>;
}
