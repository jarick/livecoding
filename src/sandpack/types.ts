export type SandpackFiles = Record<string, { code: string }>;

export type Template = string;

export interface SandpackData {
  activeFile: string;
  entry: string;
  environment?: string;
  files: SandpackFiles;
}
