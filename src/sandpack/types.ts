export type SandpackFiles = Record<string, { code: string }>;

export type Template = string;

export interface TemplatesManifest {
  buildId?: string;
  defaultTemplate: Template;
  templates: Array<{
    name: Template;
    url: string;
  }>;
}

export interface SandpackData {
  activeFile: string;
  entry: string;
  environment?: string;
  files: SandpackFiles;
}
