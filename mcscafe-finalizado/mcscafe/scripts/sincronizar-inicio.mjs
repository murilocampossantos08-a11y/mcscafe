import { readFileSync, writeFileSync } from "node:fs";

const origem = readFileSync("index.html", "utf8");
const copia = origem
  .replaceAll('"./assets/', '"../assets/')
  .replaceAll('"./paginas/', '"../paginas/')
  .replaceAll('"./login.html"', '"../login.html"');

writeFileSync("paginas/index.html", copia);
console.log("paginas/index.html atualizado a partir de index.html.");
