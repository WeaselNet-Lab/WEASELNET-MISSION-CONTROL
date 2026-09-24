import fs from "node:fs";
import postcss from "postcss";

function scopeSelector(selector, prefix) {
  const value = selector.trim();
  if (value === ":root" || value === "html" || value === "body") return prefix;
  if (value.startsWith("body.")) return `${prefix}${value.slice(4)}`;
  if (value === "*") return `${prefix}, ${prefix} *`;
  return `${prefix} ${value}`;
}

function scopeCss(css, prefix) {
  const root = postcss.parse(css);
  root.walkAtRules("import", (rule) => rule.remove());
  root.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && rule.parent.name === "keyframes") return;
    rule.selectors = rule.selectors.map((selector) => scopeSelector(selector, prefix));
  });
  return root.toString();
}

function rewriteAssets(css) {
  return css
    .replaceAll("url('workshop.webp')", "url('/explore/workshop.webp')")
    .replaceAll("url(\"workshop.webp\")", "url('/explore/workshop.webp')")
    .replaceAll("'DM Sans',Arial,sans-serif", "var(--font-dm),Arial,sans-serif")
    .replaceAll("'Space Grotesk',Arial,sans-serif", "var(--font-space),Arial,sans-serif")
    .replaceAll(
      "'Barlow Condensed','Arial Narrow',Arial,sans-serif",
      'var(--font-barlow),"Arial Narrow",Arial,sans-serif',
    )
    .replaceAll("'IBM Plex Mono',monospace", "var(--font-plex),ui-monospace,monospace");
}

const base = fs.readFileSync("weaselnet-reference/styles.css", "utf8");
const graphite = fs.readFileSync("weaselnet-reference/graphite.css", "utf8");
const notes = fs.readFileSync("weaselnet-reference/field-notes.css", "utf8");

const output = [
  "/* Scoped from weaselnet-reference. Theme A is the base. Theme B adds [data-theme=b]. */",
  rewriteAssets(scopeCss(base, ".explore-root")),
  rewriteAssets(scopeCss(graphite, '.explore-root[data-theme="b"]')),
  rewriteAssets(scopeCss(notes, ".explore-root")),
  "",
].join("\n");

fs.mkdirSync("app/explore", { recursive: true });
fs.writeFileSync("app/explore/explore.css", output);
console.log(`wrote app/explore/explore.css (${output.length} bytes)`);
