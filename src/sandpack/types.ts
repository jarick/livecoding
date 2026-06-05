export type SandpackFiles = Record<string, { code: string }>;

export type Template = "hello-world" | "todo" | "chat" | "matrix";

export interface SandpackData {
  activeFile: string;
  entry: string;
  environment?: string;
  files: SandpackFiles;
}
