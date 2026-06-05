import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { posix, relative, resolve } from "node:path";

type NextHandler = () => void;

function getBundlerApiRequestPath(req: IncomingMessage) {
  const url = req.url ?? "";
  const rawPath = url.split("?")[0] ?? "";

  try {
    const decodedPath = decodeURIComponent(rawPath).replace(/^\/+/, "");
    if (decodedPath.includes("\\")) return null;

    const normalizedPath = posix.normalize(decodedPath);
    if (!normalizedPath || normalizedPath === "." || normalizedPath.startsWith("../")) return null;
    if (normalizedPath.includes("/../")) return null;

    return normalizedPath;
  } catch {
    return null;
  }
}

async function sendBinaryFile(res: ServerResponse, filePath: string) {
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-Length": fileStat.size,
  });
  createReadStream(filePath).pipe(res);
}

function serveBundlerApi(rootDir: string) {
  return (req: IncomingMessage, res: ServerResponse, next: NextHandler) => {
    const baseDir = resolve(rootDir, "bundler-api");
    const requestPath = getBundlerApiRequestPath(req);
    if (!requestPath) {
      res.writeHead(400);
      res.end("Invalid bundler API path");
      return;
    }

    const filePath = resolve(baseDir, requestPath);
    const relativePath = relative(baseDir, filePath);
    if (relativePath.startsWith("..") || relativePath === "" || resolve(filePath) === baseDir) {
      res.writeHead(400);
      res.end("Invalid bundler API path");
      return;
    }

    void sendBinaryFile(res, filePath).catch(() => {
      next();
    });
  };
}

function bundlerApiPlugin(): Plugin {
  return {
    name: "livecoding-bundler-api",
    configureServer(server) {
      server.middlewares.use("/bundler-api/", serveBundlerApi("public"));
    },
    configurePreviewServer(server) {
      server.middlewares.use("/bundler-api/", serveBundlerApi("dist"));
    },
  };
}

export default defineConfig({
  plugins: [react(), bundlerApiPlugin()],
});
