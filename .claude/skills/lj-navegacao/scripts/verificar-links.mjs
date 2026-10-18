// Verifica links, recursos e redirecionamentos do Love Journey.
// Uso: node .claude/skills/lj-navegacao/scripts/verificar-links.mjs
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const isExternal = (value) => /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(value);
// Caminhos com "/" inicial são relativos à raiz do site, não do disco.
// O navegador ignora espaços nas pontas do atributo.
const clean = (value) => decodeURIComponent(value.trim().split(/[?#]/)[0]).replace(/^\/+/, "");

const errors = [];
const warnings = [];
const inbound = new Map();

const htmlFiles = (await readdir(root)).filter((file) => file.endsWith(".html"));
htmlFiles.forEach((file) => inbound.set(file, new Set()));

const registerLink = (from, target) => {
  const name = path.basename(target);
  if (inbound.has(name) && name !== from) inbound.get(name).add(from);
};

for (const file of htmlFiles) {
  const html = await readFile(path.join(root, file), "utf8");
  for (const [, attr, value] of html.matchAll(/\b(href|src)\s*=\s*["']([^"']+)["']/g)) {
    if (isExternal(value) || !clean(value)) continue;
    const target = path.resolve(root, clean(value));
    if (!existsSync(target)) errors.push(`${file}: ${attr}="${value}" não existe`);
    else if (target.endsWith(".html")) registerLink(file, target);
  }

  const sidebar = html.match(/<nav class="sidebar-nav"[\s\S]*?<\/nav>/);
  if (sidebar) {
    const active = sidebar[0].match(/<a[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*\bactive\b/);
    if (!active) warnings.push(`${file}: sidebar sem item active`);
    else if (path.basename(clean(active[1])) !== file)
      warnings.push(`${file}: item active da sidebar aponta para ${active[1]}`);
  }
}

const jsDirs = ["js", "js/autenticacao"];
for (const dir of jsDirs) {
  const files = (await readdir(path.join(root, dir))).filter((file) => file.endsWith(".js"));
  for (const file of files) {
    const code = await readFile(path.join(root, dir, file), "utf8");
    for (const [, value] of code.matchAll(/["'`](\.?\/?[\w-]+\.html)(?:[?#][^"'`]*)?["'`]/g)) {
      const target = path.resolve(root, clean(value));
      if (!existsSync(target)) errors.push(`${dir}/${file}: redireciona para "${value}", que não existe`);
      else registerLink(`${dir}/${file}`, target);
    }
  }
}

for (const [file, sources] of inbound) {
  if (file !== "index.html" && sources.size === 0) warnings.push(`${file}: nenhuma página ou script leva até aqui`);
}

console.log(`Páginas verificadas: ${htmlFiles.length}`);
if (errors.length) console.log(`\nERROS (${errors.length})\n- ${errors.join("\n- ")}`);
if (warnings.length) console.log(`\nAVISOS (${warnings.length})\n- ${warnings.join("\n- ")}`);
if (!errors.length) console.log("\nNenhum link quebrado.");
process.exitCode = errors.length ? 1 : 0;
