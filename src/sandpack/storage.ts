import type { SandpackData, Template } from "./types";

const STORAGE_PREFIX = "sandpack-template-cache";

const storageKey = (tmpl: Template) => {
  return `${STORAGE_PREFIX}-${tmpl}`;
};

export function loadCachedSandpackData(tmpl: Template): SandpackData | null {
  try {
    const cached = localStorage.getItem(storageKey(tmpl));
    return cached ? (JSON.parse(cached) as SandpackData) : null;
  } catch {
    return null;
  }
}

export function saveSandpackData(data: SandpackData, tmpl: Template) {
  localStorage.setItem(storageKey(tmpl), JSON.stringify(data));
}

export function clearSandpackCache(tmpl: Template) {
  localStorage.removeItem(storageKey(tmpl));
}
