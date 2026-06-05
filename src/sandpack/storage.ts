import type { SandpackData, Template } from "./types";

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
  localStorage.setItem(storageKey(tmpl), JSON.stringify(data));
}

export function clearSandpackCache(tmpl: Template) {
  localStorage.removeItem(storageKey(tmpl));
}

function isSandpackData(value: unknown): value is SandpackData {
  if (!isObject(value)) return false;
  if (typeof value.activeFile !== "string") return false;
  if (typeof value.entry !== "string") return false;
  if (value.environment !== undefined && typeof value.environment !== "string") return false;
  if (!isObject(value.files)) return false;

  return Object.values(value.files).every((file) => isObject(file) && typeof file.code === "string");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
