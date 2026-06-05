import { useSandpackFileSync } from "../sandpack/useSandpackFileSync";
import type { Template } from "../sandpack/types";

interface SandpackRuntimeSyncProps {
  entry: string;
  environment: string | undefined;
  tmpl: Template;
}

export function SandpackRuntimeSync({ entry, environment, tmpl }: SandpackRuntimeSyncProps) {
  useSandpackFileSync({ entry, environment, tmpl });

  return null;
}
