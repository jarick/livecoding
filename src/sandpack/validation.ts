import type { SandpackData } from "./types";

export function isSandpackData(value: unknown): value is SandpackData {
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
