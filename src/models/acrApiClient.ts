export type ImportMode = "Force" | "NoForce"

export interface ImportSourceCredentials {
    username: string;
    password: string;
}

export interface ImportSource {
    registryUri: string;
    resourceId: string | undefined;
    sourceImage: string;
    credentials: ImportSourceCredentials | undefined;
}

export interface ImportImageParameters {
    mode: ImportMode;
    source: ImportSource;
    targetTags: string[];
}