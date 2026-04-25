#!/usr/bin/env node
// shadow* (color/offset/opacity/radius) prop-уудыг RN 0.76+ boxShadow string-руу
// шилжүүлэх mechanical script. RN 0.81 (this project) дэмждэг.
//
// Ажиллах: `node scripts/migrate-shadows.mjs --apply`
// Default: dry run. `--apply` өгөхөд бодитоор бичнэ.

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

// Hex / rgb-ийг "R,G,B" руу хувиргана. Зөвхөн '#000', '#000000', '#RRGGBB', rgb(...).
function colorToRgb(raw) {
  const c = raw.trim();
  if (c.startsWith('#')) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    if (h.length !== 6) return null;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return `${r},${g},${b}`;
  }
  const m = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return `${m[1]},${m[2]},${m[3]}`;
  return null;
}

// Олох pattern: 4 shadow* prop-ыг ямар ч дарааллаар (зөвхөн нэг style object дотор).
// Approach: бүх 4 prop-ийг нэг газраас нэгэн зэрэг олно (any order).
function transform(src) {
  let count = 0;
  let out = src;

  // 1. shadowColor / Offset / Opacity / Radius — бүх 4-ийг нэгэн зэрэг олох loop
  // (нэг style object дотор тэдгээр бүгд гарч ирдэг үед нэгтгэнэ).
  // Stratoegi: эхлээд shadowOffset-ийг олно (онцлог shape) → түүний эргэн тойронд бусдыг хайна.
  const offsetRe =
    /shadowOffset\s*:\s*\{\s*width\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*height\s*:\s*(-?\d+(?:\.\d+)?)\s*\}\s*,?/g;

  // Олон pass — бид тогтвортой replacement хийхийн тулд index-аар эргэж олно.
  let changed = true;
  while (changed) {
    changed = false;
    offsetRe.lastIndex = 0;
    const match = offsetRe.exec(out);
    if (!match) break;
    const [offsetSpan, w, h] = match;
    const startLook = Math.max(0, match.index - 800);
    const endLook = Math.min(out.length, match.index + 800);
    const window = out.slice(startLook, endLook);

    const colorMatch = window.match(
      /shadowColor\s*:\s*['"]([^'"]+)['"]\s*,?/
    );
    const opacityMatch = window.match(/shadowOpacity\s*:\s*(-?\d+(?:\.\d+)?)\s*,?/);
    const radiusMatch = window.match(/shadowRadius\s*:\s*(-?\d+(?:\.\d+)?)\s*,?/);

    if (!colorMatch || !opacityMatch || !radiusMatch) {
      // Тус тусдаа байгаа бол энэ pass-д орхино — exit
      break;
    }

    const rgb = colorToRgb(colorMatch[1]);
    if (!rgb) break;
    const opacity = opacityMatch[1];
    const radius = radiusMatch[1];

    const boxShadow = `boxShadow: '${w}px ${h}px ${radius}px rgba(${rgb},${opacity})'`;

    // Window дотроо бүгдийг устгаж, эхний шилжүүлж тавьсан газарт boxShadow тавина.
    // Бүс — startLook + indexInWindow болж абсолют index руу оруулна.
    const absoluteRanges = [];
    const colorAbs = startLook + colorMatch.index;
    absoluteRanges.push({
      start: colorAbs,
      end: colorAbs + colorMatch[0].length,
    });
    const opacityAbs = startLook + opacityMatch.index;
    absoluteRanges.push({
      start: opacityAbs,
      end: opacityAbs + opacityMatch[0].length,
    });
    const radiusAbs = startLook + radiusMatch.index;
    absoluteRanges.push({
      start: radiusAbs,
      end: radiusAbs + radiusMatch[0].length,
    });
    const offsetAbs = match.index;
    absoluteRanges.push({
      start: offsetAbs,
      end: offsetAbs + offsetSpan.length,
    });

    // descending sort
    absoluteRanges.sort((a, b) => b.start - a.start);
    // эхлээд эхний (хамгийн жижиг index)-д boxShadow тавь
    const insertAt = Math.min(...absoluteRanges.map((r) => r.start));

    // бүх range-ийг устгана (descending order)
    let mutable = out;
    for (const r of absoluteRanges) {
      mutable = mutable.slice(0, r.start) + mutable.slice(r.end);
    }
    // Insert (insertAt-ийг устгасны дараа shift нэмэгдэхгүй — бүх range descending устгасан)
    mutable = mutable.slice(0, insertAt) + boxShadow + ', ' + mutable.slice(insertAt);

    // trailing-д шаардлагагүй "," хосыг цэгцлэх
    mutable = mutable
      .replace(/,(\s*),/g, ',$1')
      .replace(/,\s*\}/g, ' }')
      .replace(/\{\s*,/g, '{ ');

    out = mutable;
    count += 1;
    changed = true;
  }

  return { out, count };
}

let totalFiles = 0;
let totalReplacements = 0;
const changedFiles = [];

for (const file of walk(ROOT)) {
  // Зөвхөн app/ + components/ доорх UI файлууд (services-д shadow байх ёсгүй)
  if (!file.includes(`${path.sep}app${path.sep}`) &&
      !file.includes(`${path.sep}components${path.sep}`)) continue;

  const src = fs.readFileSync(file, 'utf8');
  if (!/shadowColor|shadowOffset|shadowOpacity|shadowRadius/.test(src)) continue;
  totalFiles += 1;

  const { out, count } = transform(src);
  if (count === 0) continue;

  totalReplacements += count;
  changedFiles.push({ file: path.relative(ROOT, file), count });

  if (APPLY && out !== src) {
    fs.writeFileSync(file, out);
  }
}

console.log(`${APPLY ? 'Applied' : 'Would apply'} ${totalReplacements} shadow→boxShadow replacements across ${changedFiles.length}/${totalFiles} files`);
for (const c of changedFiles) {
  console.log(`  ${c.file} (${c.count})`);
}
if (!APPLY) console.log('\n(dry run — pass --apply to write)');
