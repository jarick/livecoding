import { execSync } from "child_process";
import { existsSync, mkdirSync, cpSync, rmSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { decode } from "@msgpack/msgpack";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bundlerDir = resolve(__dirname, "submodules", "sandpack-bundler");
const publicDir = resolve(__dirname, "public", "bundler");
const apiDir = resolve(__dirname, "public", "bundler-api");

const CDN_URL = "https://sandpack-cdn-staging.blazingly.io/";
const CDN_VERSION = 5;
const PREVIEW_HEARTBEAT_SCRIPT = `<script>
function sendLivecodingPreviewHeartbeat(){
  window.parent.postMessage({type:"livecoding-preview-heartbeat"},"*");
}
sendLivecodingPreviewHeartbeat();
setInterval(sendLivecodingPreviewHeartbeat,500);
</script>`;

if (!existsSync(bundlerDir)) {
  console.error("sandpack-bundler submodule not found at", bundlerDir);
  console.error("Run: git submodule update --init");
  process.exit(1);
}

console.log("Installing sandpack-bundler dependencies...");
execSync("npm install --ignore-scripts --no-audit --no-fund --legacy-peer-deps", { cwd: bundlerDir, stdio: "inherit" });

console.log("Building sandpack-bundler...");
const bundlerDist = resolve(bundlerDir, "dist");
if (existsSync(bundlerDist)) {
  rmSync(bundlerDist, { recursive: true });
}
execSync("npx parcel build ./src/index.html --no-scope-hoist", { cwd: bundlerDir, stdio: "inherit" });
const headersSrc = resolve(bundlerDir, "_headers");
if (existsSync(headersSrc)) {
  cpSync(headersSrc, resolve(bundlerDist, "_headers"));
}

if (existsSync(publicDir)) {
  rmSync(publicDir, { recursive: true });
}
mkdirSync(publicDir, { recursive: true });

console.log("Copying bundler to public/bundler/...");
cpSync(bundlerDist, publicDir, { recursive: true });

const indexPath = resolve(publicDir, "index.html");
let html = readFileSync(indexPath, "utf8");
html = html.replace(/(src|href)="\//g, '$1="/bundler/');
html = html.replace("</head>", `${PREVIEW_HEARTBEAT_SCRIPT}</head>`);
writeFileSync(indexPath, html, "utf8");

console.log("Replacing blazingly.io CDN URL with /bundler-api/...");
for (const file of readdirSync(publicDir)) {
  if (!file.endsWith('.js') && !file.endsWith('.js.map')) continue;
  if (file.endsWith('.runtime.js') || file.endsWith('.runtime.js.map')) continue;
  const filePath = resolve(publicDir, file);
  let content = readFileSync(filePath, "utf8");
  let updated = content.replace(CDN_URL, "/bundler-api/");
  if (updated !== content) {
    writeFileSync(filePath, updated, "utf8");
    console.log("  " + file);
  }
}

console.log("Patching encodeRequest for URL-safe base64 paths...");
let patchedEncodeRequest = false;
for (const file of readdirSync(publicDir)) {
  if (!file.endsWith('.js') || file.endsWith('.runtime.js') || file.endsWith('.js.map')) continue;
  const filePath = resolve(publicDir, file);
  const content = readFileSync(filePath, "utf8");
  const updated = content.replace(
    /btoa\(`5\(\$\{(\w+)\}\)`\)/g,
    "btoa(`5(${$1})`).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'')",
  );
  if (updated !== content) {
    patchedEncodeRequest = true;
    writeFileSync(filePath, updated, "utf8");
    console.log("  " + file);
  }
}
if (!patchedEncodeRequest) {
  console.warn("  encodeRequest patch was not applied; bundler output may have changed");
}

function rawBtoa(str) {
  return Buffer.from(str).toString("base64");
}

function urlSafeBtoa(str) {
  return rawBtoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sortObj(obj) {
  return Object.keys(obj).sort().reduce((o, k) => { o[k] = obj[k]; return o; }, {});
}

// Bundler's flow: user deps -> preset.augmentDependencies -> filterBuildDeps -> sortObj -> encodePayload
// Build deps removed by filterBuildDeps: react-scripts, parcel, vite, @babel/core, babel-*
const buildDeps = new Set([
  "react-scripts",
  "parcel",
  "parcel-bundler",
  "vite",
  "@babel/core",
  "loader-utils",
  "typescript",
]);

function isBuildDep(dep) {
  return (
    buildDeps.has(dep) ||
    dep.startsWith("@babel/") ||
    dep.includes("babel-plugin") ||
    dep.includes("babel-preset")
  );
}

function getRuntimeDeps(pkgPath) {
  const deps = {};
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    Object.assign(deps, pkg.dependencies || {});
  }

  for (const dep of Object.keys(deps)) {
    if (isBuildDep(dep)) {
      delete deps[dep];
    }
  }

  if (!Object.keys(deps).length) {
    deps.react = "^19.2.0";
    deps["react-dom"] = "^19.2.0";
  }

  // preset.augmentDependencies adds react-refresh and core-js
  deps["react-refresh"] = deps["react-refresh"] || "^0.11.0";
  deps["core-js"] = deps["core-js"] || "3.22.7";

  return sortObj(deps);
}

function getTemplateDependencySets() {
  const filesDir = resolve(__dirname, "files");
  const sets = new Map();

  if (existsSync(resolve(filesDir, "package.json"))) {
    const deps = getRuntimeDeps(resolve(filesDir, "package.json"));
    sets.set(JSON.stringify(deps), { label: "default", deps });
  }

  if (existsSync(filesDir)) {
    for (const entry of readdirSync(filesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const deps = getRuntimeDeps(resolve(filesDir, entry.name, "package.json"));
      const key = JSON.stringify(deps);
      if (!sets.has(key)) {
        sets.set(key, { label: entry.name, deps });
      }
    }
  }

  if (!sets.size) {
    const deps = getRuntimeDeps(resolve(filesDir, "package.json"));
    sets.set(JSON.stringify(deps), { label: "fallback", deps });
  }

  return Array.from(sets.values());
}

if (!existsSync(apiDir)) {
  mkdirSync(apiDir, { recursive: true });
} else {
  // Remove stale flat-file entries from previous runs
  for (const f of readdirSync(apiDir)) {
    if (f.startsWith("dep_tree_") || f.startsWith("package_")) {
      rmSync(join(apiDir, f), { recursive: true, force: true });
    }
  }
}

function download(url, subDir, fileName) {
  const dirPath = resolve(apiDir, subDir);
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
  const filePath = join(dirPath, fileName);

  return fetch(url, { signal: AbortSignal.timeout(60000) })
    .then(async (response) => {
      if (!response.ok) {
        console.error("  Failed: " + url.slice(60, 120) + " => " + response.status);
        return false;
      }

      const buf = Buffer.from(await response.arrayBuffer());
      writeFileSync(filePath, buf);
      console.log("  Saved " + buf.length + " bytes => bundler-api/" + subDir + "/" + fileName);
      return true;
    })
    .catch((e) => {
      console.error("  Error: " + url.slice(60, 120) + " => " + e.message.slice(0, 60));
      return false;
    });
}

async function prefetchDependencySet({ label, deps }) {
  const payload = CDN_VERSION + "(" + JSON.stringify(deps) + ")";
  const rawHash = rawBtoa(payload);
  const safeHash = urlSafeBtoa(payload);

  console.log("Pre-fetching dependency manifest for " + label + ": " + JSON.stringify(deps));
  console.log("  Raw hash: " + rawHash);
  console.log("  Safe hash: " + safeHash);

  // Use RAW hash for CDN request (CDN requires = padding)
  const rawDepTreeUrl = CDN_URL + "dep_tree/" + rawHash;
  // Use SAFE hash for filename (matches patched bundler requests)
  const depTreeSaved = await download(rawDepTreeUrl, "dep_tree", safeHash);
  if (!depTreeSaved) return;

  const manifestBuf = readFileSync(resolve(apiDir, "dep_tree", safeHash));
  const manifest = decode(manifestBuf);
  let count = 0;
  for (const dep of manifest) {
    const name = dep.n ?? dep.name;
    const version = dep.v ?? dep.version;
    if (!name || !version) continue;
    const specifier = name + "@" + version;
    const pkgPayload = CDN_VERSION + "(" + specifier + ")";
    const pkgRawHash = rawBtoa(pkgPayload);
    const pkgSafeHash = urlSafeBtoa(pkgPayload);
    const pkgUrl = CDN_URL + "package/" + pkgRawHash;
    const ok = await download(pkgUrl, "package", pkgSafeHash);
    if (ok) count++;
  }
  console.log("Pre-fetched " + count + "/" + manifest.length + " packages for " + label);
}

for (const dependencySet of getTemplateDependencySets()) {
  await prefetchDependencySet(dependencySet);
}

console.log("Bundler build complete");
