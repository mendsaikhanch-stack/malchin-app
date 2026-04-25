#!/usr/bin/env node
// Migrate-shadows.mjs зөвхөн shadow* prop-уудыг устгасны дараа үлдсэн
// хоосон мөрүүдийг цэвэрлэнэ. Idempotent.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.tsx') || full.endsWith('.ts')) out.push(full);
  }
  return out;
}

let totalFiles = 0;
let totalFixed = 0;

for (const file of walk(ROOT)) {
  if (!file.includes(`${path.sep}app${path.sep}`) &&
      !file.includes(`${path.sep}components${path.sep}`)) continue;

  const src = fs.readFileSync(file, 'utf8');
  if (!/boxShadow/.test(src)) continue;
  totalFiles += 1;

  let out = src;

  // 1. boxShadow-ийн хойноо 1+ empty line + дараагийн prop → нэг шинэ мөр
  //    (зөвхөн boxShadow-ийн ард).
  out = out.replace(
    /(boxShadow:\s*'[^']*',?\s*)(\n[ \t]*\n)+([ \t]*[a-zA-Z_])/g,
    '$1\n$3'
  );

  // 2. Trailing whitespace-тэй comma → ', ' цэвэрлэх (boxShadow-ийн ард)
  out = out.replace(/(boxShadow:\s*'[^']*'),\s*\n[ \t]+\n/g, '$1,\n');

  // 3. Style object дотор үлдсэн "{ ... }, ," гэсэн хоёр comma alex.
  out = out.replace(/,(\s*),(?=\s*\})/g, ',$1');

  // 4. Trailing single comma + newline + closing brace ',\n  }' → '\n  }'
  // (Хэрэв ',' boxShadow-ийн ард нэмэгдсэн бол OK хэвээр)

  if (out !== src) {
    totalFixed += 1;
    if (APPLY) fs.writeFileSync(file, out);
  }
}

console.log(`${APPLY ? 'Applied' : 'Would apply'} cleanup to ${totalFixed}/${totalFiles} files`);
if (!APPLY) console.log('(dry run — pass --apply to write)');
