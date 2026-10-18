// Monta dist/ apenas com os arquivos públicos do site para o Cloudflare Pages.
// Uso: node scripts/build-pages.mjs
import { cp, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const publicDirs = ["assets", "css", "js"];

await rm(dist, { recursive: true, force: true });

const pages = (await readdir(root)).filter((file) => file.endsWith(".html"));
for (const page of pages) await cp(path.join(root, page), path.join(dist, page));
for (const dir of publicDirs) {
  await cp(path.join(root, dir), path.join(dist, dir), { recursive: true });
}

console.log(`dist/ pronto: ${pages.length} páginas + ${publicDirs.join(", ")}`);
