import { useEffect, useRef } from "react";
import { useSandpack } from "@codesandbox/sandpack-react";
import { saveSandpackData } from "./storage";
import type { Template } from "./types";

interface SandpackFileSyncOptions {
  entry: string;
  environment: string | undefined;
  tmpl: Template;
}

export function useSandpackFileSync({ entry, environment, tmpl }: SandpackFileSyncOptions) {
  const { sandpack } = useSandpack();
  const ready = useRef(false);

  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      return;
    }

    const timer = window.setTimeout(() => {
      saveSandpackData({
        activeFile: sandpack.activeFile,
        entry,
        environment,
        files: sandpack.files,
      }, tmpl);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [sandpack.files, sandpack.activeFile, entry, environment, tmpl]);
}
