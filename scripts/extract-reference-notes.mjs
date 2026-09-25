import fs from "node:fs";

const text = fs.readFileSync("weaselnet-reference/app.js", "utf8");
const start = text.indexOf("const notes=");
const end = text.indexOf("const dialog=");
if (start < 0 || end < 0) {
  throw new Error("Could not find the reference notes object.");
}
const body = text.slice(start + "const notes=".length, end).trim().replace(/;$/, "");
const notes = Function(`"use strict"; return (${body});`)();
fs.mkdirSync("lib/db", { recursive: true });
fs.writeFileSync("lib/db/reference-notes.json", JSON.stringify(notes, null, 2));
console.log(Object.keys(notes).join(","));
