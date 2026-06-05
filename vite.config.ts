import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { PreviewServer, ViteDevServer } from "vite";
import { existsSync, readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";

type NextHandler = () => void;

function getBundlerApiRequestPath(req: IncomingMessage) {
  const url = req.url ?? "";
  return decodeURIComponent(url.split("?")[0] ?? "").replace(/^\/+/, "");
}

function sendBinaryFile(res: ServerResponse, filePath: string) {
  const content = readFileSync(filePath);

  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-Length": content.length,
  });
  res.end(content);
}

function serveBundlerApi(rootDir: string) {
  return (req: IncomingMessage, res: ServerResponse, next: NextHandler) => {
    const filePath = resolve(rootDir, "bundler-api", getBundlerApiRequestPath(req));
    if (!existsSync(filePath)) {
      next();
      return;
    }

    sendBinaryFile(res, filePath);
  };
}

export default defineConfig({
  plugins: [react()],
  server: {
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/bundler-api/", serveBundlerApi("public"));
    },
  },
  preview: {
    configureServer(server: PreviewServer) {
      server.middlewares.use("/bundler-api/", serveBundlerApi("dist"));
    },
  },
});
