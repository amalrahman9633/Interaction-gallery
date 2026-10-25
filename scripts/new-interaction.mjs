// Usage: npm run new -- <slug> ["Title"] [--study]
// Copies src/interactions/_template to src/interactions/<slug> and fills in meta.ts.
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const study = args.includes("--study");
const [slug, titleArg] = args.filter((a) => !a.startsWith("--"));

if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: npm run new -- <kebab-case-slug> ["Title"] [--study]');
  process.exit(1);
}

const dest = join(root, "src/interactions", slug);
if (existsSync(dest)) {
  console.error(`src/interactions/${slug} already exists.`);
  process.exit(1);
}

cpSync(join(root, "src/interactions/_template"), dest, { recursive: true });

const title = titleArg ?? slug.replace(/(^|-)(\w)/g, (_, sep, c) => (sep ? " " : "") + c.toUpperCase());
const today = new Date().toISOString().slice(0, 10);
const metaPath = join(dest, "meta.ts");
let meta = readFileSync(metaPath, "utf8")
  .replace('slug: "_template"', `slug: "${slug}"`)
  .replace('title: "Template"', `title: ${JSON.stringify(title)}`)
  .replace('added: "2026-01-01"', `added: "${today}"`);
if (study) {
  meta = meta
    .replace('kind: "original"', 'kind: "study"')
    .replace("inspiredBy: undefined,", 'inspiredBy: { name: "TODO: credit", url: "TODO" },');
}
writeFileSync(metaPath, meta);

const comp = join(dest, "Interaction.tsx");
const pascal = title.replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^./, (c) => c.toUpperCase());
writeFileSync(comp, readFileSync(comp, "utf8").replace("function Template(", `function ${pascal}(`));

console.log(`Created src/interactions/${slug}`);
console.log(`Open http://localhost:5173/playground/${slug} (npm run dev)`);
