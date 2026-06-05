import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filesDir = resolve(__dirname, "files");
const publicDir = resolve(__dirname, "public");

if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

function walk(rootDir, dir = rootDir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const result = {};
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(result, walk(rootDir, fullPath));
    } else {
      const relPath = "/" + relative(rootDir, fullPath).replace(/\\/g, "/");
      result[relPath] = { code: readFileSync(fullPath, "utf8") };
    }
  }
  return result;
}

const templates = readdirSync(filesDir, { withFileTypes: true }).filter((e) => e.isDirectory());

for (const tmpl of templates) {
  const dir = resolve(filesDir, tmpl.name);
  const files = walk(dir);
  const main =
    Object.keys(files).find((f) => f === "/App.tsx" || f === "/App.js" || f === "/index.js") ||
    Object.keys(files)[0];
  const pkgPath = resolve(dir, "package.json");
  let entry = "/index.js";
  let environment = "create-react-app";
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      entry = "/" + (pkg.main || "index.js").replace(/^\//, "");
      if (pkg.environment) environment = pkg.environment;
    } catch {}
  }
  const output = { activeFile: main, entry, environment, files };
  const outPath = resolve(publicDir, `sandpack-files-${tmpl.name}.json`);
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
  const count = Object.keys(files).length;
  console.log(`  ${tmpl.name}: ${count} files, activeFile=${main}, entry=${entry}`);
}

// Default (no template) = hello-world
const defaultSrc = resolve(publicDir, "sandpack-files-hello-world.json");
const defaultDst = resolve(publicDir, "sandpack-files.json");
if (existsSync(defaultSrc)) {
  writeFileSync(defaultDst, readFileSync(defaultSrc, "utf8"));
  console.log("  default: sandpack-files.json -> hello-world");
}
console.log(`Built ${templates.length} templates to public/sandpack-files-*.json`);
