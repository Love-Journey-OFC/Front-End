// Verificações automáticas do Love Journey (local e no GitHub Actions).
// Uso: node scripts/verificar.mjs
import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const listFiles = async (dir, extensions) => {
  const entries = await readdir(path.join(root, dir), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(relative, extensions)));
    else if (extensions.includes(path.extname(entry.name))) files.push(relative);
  }
  return files;
};

const run = (label, args) => {
  try {
    execFileSync(process.execPath, args, { cwd: root, stdio: "pipe" });
  } catch (error) {
    failures.push(`${label}\n${String(error.stderr || error.stdout).trim()}`);
  }
};

// 1. Sintaxe de todos os scripts
const scripts = [
  ...(await listFiles("js", [".js"])),
  ...(await listFiles("lib", [".mjs"])),
  ...(await listFiles("functions", [".js"])),
  ...(await listFiles("scripts", [".mjs"])),
  "server.mjs",
];
for (const file of scripts) run(`Erro de sintaxe em ${file}`, ["--check", file]);

// 2. Links, imagens e redirecionamentos
run("Links quebrados", [".claude/skills/lj-navegacao/scripts/verificar-links.mjs"]);

// 3. Nenhuma chave de API no front-end
const frontEnd = [
  ...(await readdir(root)).filter((file) => file.endsWith(".html")),
  ...(await listFiles("js", [".js"])),
];
for (const file of frontEnd) {
  const content = await readFile(path.join(root, file), "utf8");
  if (/AIza[0-9A-Za-z_-]{30,}|generativelanguage\.googleapis\.com/.test(content))
    failures.push(`Possível chave ou chamada direta ao Gemini em ${file}`);
}

console.log(`Scripts verificados: ${scripts.length} · arquivos do front-end: ${frontEnd.length}`);
if (failures.length) {
  console.error(`\nFALHAS (${failures.length})\n\n${failures.join("\n\n")}`);
  process.exitCode = 1;
} else {
  console.log("Tudo certo.");
}
