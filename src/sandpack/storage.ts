import type { SandpackData, Template } from "./types";
import { isSandpackData } from "./validation";

const STORAGE_PREFIX = "sandpack-template-cache";

const storageKey = (tmpl: Template) => {
  return `${STORAGE_PREFIX}-${tmpl}`;
};

export function loadCachedSandpackData(tmpl: Template): SandpackData | null {
  try {
    const cached = localStorage.getItem(storageKey(tmpl));
    if (!cached) return null;

    const parsed: unknown = JSON.parse(cached);
    return isSandpackData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSandpackData(data: SandpackData, tmpl: Template) {
  try {
    localStorage.setItem(storageKey(tmpl), JSON.stringify(data));
  } catch {
    // Cache failures should not interrupt editing or preview updates.
  }
}

export function clearSandpackCache(tmpl: Template) {
  localStorage.removeItem(storageKey(tmpl));
}
