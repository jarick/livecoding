import { useEffect, useMemo, useState } from "react";
import { sanitizeSandpackData } from "./dependencies";
import { loadCachedSandpackData } from "./storage";
import type { SandpackData, Template } from "./types";

const jsonUrl = (tmpl: Template) => {
  return `/sandpack-files-${tmpl}.json`;
};

const loadData = async (tmpl: Template) => {
  try {
    const response = await fetch(jsonUrl(tmpl));
    if (!response.ok) {
      throw new Error("Failed to load files");
    }
    return (await response.json()) as SandpackData;
  } catch {
    return null;
  }
};

export function useSandpackData(tmpl: Template) {
  const [state, setState] = useState(() => ({
    data: loadCachedSandpackData(tmpl),
    tmpl,
  }));

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve(loadCachedSandpackData(tmpl))
      .then((cached) => cached ?? loadData(tmpl))
      .then((data) => {
        if (cancelled) return;
        setState({ data, tmpl });
      });

    return () => {
      cancelled = true;
    };
  }, [tmpl]);

  const data = state.tmpl === tmpl ? state.data : null;

  return useMemo(() => (data ? sanitizeSandpackData(data) : null), [data]);
}
