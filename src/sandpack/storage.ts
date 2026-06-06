import type { SandpackData, Template } from "./types";
import { isSandpackData } from "./validation";

const STORAGE_PREFIX = "sandpack-template-cache";
const STORAGE_BUILD_KEY = "sandpack-storage-build-id";

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

export function resetSandpackCacheOnBuildChange(buildId: string) {
  try {
    if (localStorage.getItem(STORAGE_BUILD_KEY) === buildId) return;

    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(`${STORAGE_PREFIX}-`)) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(STORAGE_BUILD_KEY, buildId);
  } catch {
    // Storage availability should not block loading fresh template files.
  }
}
