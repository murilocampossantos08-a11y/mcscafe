import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(process.cwd());
const errors = [];
const allowedExtensions = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".sql",
  ".svg",
  ".png",
  ".jpeg",
  ".jpg",
]);

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "node_modules") {
      return [];
    }

    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function localTarget(fromFile, reference) {
  const pathOnly = reference.split("#")[0].split("?")[0];
  if (
    !pathOnly ||
    pathOnly.startsWith("#") ||
    /^(https?:|mailto:|tel:|data:)/i.test(pathOnly)
  ) {
    return null;
  }

  const requested = pathOnly.startsWith("/")
    ? resolve(root, `.${pathOnly}`)
    : resolve(fromFile, "..", pathOnly);

  if (existsSync(requested)) {
    return requested;
  }

  if (!extname(requested) && existsSync(`${requested}.html`)) {
    return `${requested}.html`;
  }

  return requested;
}

const files = listFiles(root);

for (const file of files) {
  const fileName = relative(root, file).replaceAll("\\", "/");
  const extension = extname(file);

  const isRootDotFile = fileName.startsWith(".") && !fileName.includes("/");
  if (
    !allowedExtensions.has(extension) &&
    !fileName.startsWith(".github/") &&
    !isRootDotFile
  ) {
    errors.push(`Extensão não esperada: ${fileName}`);
  }

  if (fileName !== "README.md" && /[A-ZÀ-ÿ ]/.test(fileName)) {
    errors.push(`Use nome minúsculo, sem acentos e sem espaços: ${fileName}`);
  }

  if (extension === ".js" || extension === ".mjs") {
    try {
      execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    } catch (error) {
      errors.push(
        `JavaScript inválido em ${fileName}: ${error.stderr.toString().trim()}`,
      );
    }
  }

  if (extension !== ".html") {
    continue;
  }

  const html = readFileSync(file, "utf8");

  if (!/<html\s+lang="pt-BR">/i.test(html)) {
    errors.push(`${fileName}: defina lang="pt-BR" no elemento html.`);
  }

  if (!/<meta\s+name="viewport"/i.test(html)) {
    errors.push(`${fileName}: inclua a meta viewport.`);
  }

  if (!/<title>[^<]+<\/title>/i.test(html)) {
    errors.push(`${fileName}: inclua um título.`);
  }

  if (/\sonclick\s*=/i.test(html)) {
    errors.push(
      `${fileName}: não use onclick no HTML; registre o evento no JavaScript.`,
    );
  }

  const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) ?? [];
  if (buttons.some((button) => /<a\b/i.test(button))) {
    errors.push(`${fileName}: não aninhe link dentro de botão.`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/gi)].map((match) => match[1]);
  for (const id of new Set(ids)) {
    if (ids.filter((currentId) => currentId === id).length > 1) {
      errors.push(`${fileName}: id duplicado "${id}".`);
    }
  }

  const references = [...html.matchAll(/\s(?:href|src)="([^"]+)"/gi)].map(
    (match) => match[1],
  );
  for (const reference of references) {
    const target = localTarget(file, reference);
    if (target && !existsSync(target)) {
      errors.push(`${fileName}: referência ausente "${reference}".`);
    }
  }
}

try {
  JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
} catch (error) {
  errors.push(`Configuração JSON inválida: ${error.message}`);
}

if (errors.length > 0) {
  console.error("Falhas encontradas:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Verificação concluída: ${files.length} arquivos analisados, sem erros.`,
  );
}
