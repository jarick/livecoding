import { useEffect, useMemo, useState } from "react";
import { sanitizeSandpackData } from "./dependencies";
import { loadCachedSandpackData } from "./storage";
import type { SandpackData, Template, TemplatesManifest } from "./types";
import { isSandpackData } from "./validation";

const DEFAULT_TEMPLATE = "hello-world";
const DEFAULT_MANIFEST: TemplatesManifest = {
  defaultTemplate: DEFAULT_TEMPLATE,
  templates: [{ name: DEFAULT_TEMPLATE, url: "/sandpack-files.json" }],
};

const loadManifest = async () => {
  try {
    const response = await fetch("/sandpack-templates.json");
    if (!response.ok) return DEFAULT_MANIFEST;

    const manifest: unknown = await response.json();
    return isTemplatesManifest(manifest) ? manifest : DEFAULT_MANIFEST;
  } catch {
    return DEFAULT_MANIFEST;
  }
};

const loadData = async (url: string): Promise<SandpackData | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to load files");
    }
    const data: unknown = await response.json();
    return isSandpackData(data) ? data : null;
  } catch {
    return null;
  }
};

export function useSandpackData(requestedTemplate: Template | null) {
  const [state, setState] = useState(() => ({
    data: null as SandpackData | null,
    tmpl: DEFAULT_TEMPLATE,
  }));

  useEffect(() => {
    let cancelled = false;

    void loadManifest()
      .then(async (manifest) => {
        const defaultTemplate =
          manifest.templates.find((template) => template.name === manifest.defaultTemplate) ??
          DEFAULT_MANIFEST.templates[0];
        const selectedTemplate =
          manifest.templates.find((template) => template.name === requestedTemplate) ??
          defaultTemplate;
        const cached = loadCachedSandpackData(selectedTemplate.name);
        const data = cached ?? (await loadData(selectedTemplate.url));

        return { data, tmpl: selectedTemplate.name };
      })
      .then(({ data, tmpl }) => {
        if (cancelled) return;
        setState({ data, tmpl });
      });

    return () => {
      cancelled = true;
    };
  }, [requestedTemplate]);

  const data = state.data;

  return useMemo(
    () => ({
      data: data ? sanitizeSandpackData(data) : null,
      template: state.tmpl,
    }),
    [data, state.tmpl],
  );
}

function isTemplatesManifest(value: unknown): value is TemplatesManifest {
  if (!isObject(value)) return false;
  if (typeof value.defaultTemplate !== "string") return false;
  if (!Array.isArray(value.templates)) return false;

  return value.templates.every(
    (template) =>
      isObject(template) && typeof template.name === "string" && typeof template.url === "string",
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
