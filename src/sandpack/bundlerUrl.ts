export function getBundlerUrl(): string {
  const { hostname, origin, port, protocol } = window.location;
  const portSuffix = port ? `:${port}` : "";
  const bundlerOriginMatch = getEnvString("VITE_BUNDLER_ORIGIN_MATCH");
  const bundlerUrl = getEnvString("VITE_BUNDLER_URL");

  if (hostname === "localhost") {
    return `${protocol}//[::1]${portSuffix}/bundler/index.html`;
  }

  if (hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]") {
    return `${protocol}//localhost${portSuffix}/bundler/index.html`;
  }

  if (bundlerOriginMatch && bundlerUrl && origin === normalizeOriginMatch(bundlerOriginMatch)) {
    return bundlerUrl;
  }

  return `${origin}/bundler/index.html`;
}

function getEnvString(name: string) {
  const env = import.meta.env as Record<string, unknown>;
  const value = env[name];

  return typeof value === "string" ? value : undefined;
}

function normalizeOriginMatch(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, "");
  }
}
