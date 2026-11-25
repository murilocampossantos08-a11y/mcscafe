import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const projectRoot = resolve(process.cwd());
const port = Number(process.env.PORT ?? 3000);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function resolveFile(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const candidate = normalize(join(projectRoot, cleanPath));

  if (!candidate.startsWith(projectRoot)) {
    return null;
  }

  if (existsSync(candidate)) {
    const candidateStats = statSync(candidate);
    if (candidateStats.isFile()) {
      return candidate;
    }

    if (candidateStats.isDirectory()) {
      const directoryIndex = join(candidate, "index.html");
      if (existsSync(directoryIndex)) {
        return directoryIndex;
      }
    }
  }

  if (!extname(candidate) && existsSync(`${candidate}.html`)) {
    return `${candidate}.html`;
  }

  return null;
}

const server = createServer((request, response) => {
  const filePath = resolveFile(request.url ?? "/");

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Página não encontrada.");
    return;
  }

  response.writeHead(200, {
    "Content-Type":
      contentTypes[extname(filePath).toLowerCase()] ??
      "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`MCS Café disponível em http://localhost:${port}`);
});
