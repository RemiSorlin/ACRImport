export type ImportMode = "Force" | "NoForce"

export interface ImportSource {
    resourceId: string | undefined;
    sourceImage: string;
}

export interface ImportImageParameters {
    mode: ImportMode;
    source: ImportSource;
    targetTags: string[];
}