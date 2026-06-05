import type { SandpackData } from "./types";

const FALLBACK_DEPENDENCIES = {
  react: "^18.0.0",
  "react-dom": "^18.0.0",
};

const BUILD_DEPENDENCIES = new Set([
  "react-scripts",
  "parcel",
  "parcel-bundler",
  "vite",
  "@babel/core",
  "loader-utils",
  "typescript",
]);

function isRuntimeDependency(name: string) {
  return (
    !BUILD_DEPENDENCIES.has(name) &&
    !name.startsWith("@babel/") &&
    !name.includes("babel-plugin") &&
    !name.includes("babel-preset")
  );
}

function filterRuntimeDependencies(dependencies: Record<string, string> | undefined) {
  return Object.fromEntries(
    Object.entries(dependencies ?? {}).filter(([name]) => isRuntimeDependency(name)),
  );
}

function parsePackageJson(code: string) {
  return JSON.parse(code) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
}

function getPackageFile(data: SandpackData) {
  const files = data.files as Partial<SandpackData["files"]>;
  return files["/package.json"];
}

export function getSandboxDependencies(data: SandpackData) {
  try {
    const pkg = parsePackageJson(getPackageFile(data)?.code ?? "{}");
    const dependencies = filterRuntimeDependencies(pkg.dependencies);

    return Object.keys(dependencies).length ? dependencies : FALLBACK_DEPENDENCIES;
  } catch {
    return FALLBACK_DEPENDENCIES;
  }
}

export function sanitizePackageJson(code: string) {
  try {
    const pkg = parsePackageJson(code);

    pkg.dependencies = filterRuntimeDependencies(pkg.dependencies);
    pkg.devDependencies = filterRuntimeDependencies(pkg.devDependencies);

    return JSON.stringify(pkg, null, 2);
  } catch {
    return code;
  }
}

export function sanitizeSandpackData(data: SandpackData) {
  const packageFile = getPackageFile(data);
  if (!packageFile) return data;

  return {
    ...data,
    files: {
      ...data.files,
      "/package.json": {
        code: sanitizePackageJson(packageFile.code),
      },
    },
  };
}
