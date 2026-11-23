// Copy protocol spec markdown into src/content/specs/.
// Usage: npm run sync-specs -- <file-or-dir> [...]
// Picks up files named ADP-*.md / NIP-*.md (case-insensitive) from each dir given.
import { cpSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const dest = new URL('../src/content/specs/', import.meta.url).pathname;
mkdirSync(dest, { recursive: true });
const SPEC = /^(adp|nip)-[\w-]+\.md$/i;
const args = process.argv.slice(2);
if (!args.length) {
  console.error('usage: npm run sync-specs -- <file-or-dir> [...]');
  process.exit(1);
}
let n = 0;
for (const a of args) {
  const files = statSync(a).isDirectory() ? readdirSync(a).filter((f) => SPEC.test(f)).map((f) => join(a, f)) : [a];
  for (const f of files) {
    cpSync(f, join(dest, basename(f)));
    console.log('  +', basename(f));
    n++;
  }
}
console.log(`${n} spec(s) copied to src/content/specs/`);
