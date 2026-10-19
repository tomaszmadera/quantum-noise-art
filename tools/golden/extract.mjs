// Copies the <svg> markup of every rendered case into ../../fixtures/<name>.svg.
import { readFileSync, writeFileSync } from 'node:fs';

const cases = JSON.parse(readFileSync(new URL('../../fixtures/cases.json', import.meta.url), 'utf8'));
for (const c of cases) {
  const html = readFileSync(new URL(`./dist/${c.name}.html`, import.meta.url), 'utf8');
  const start = html.indexOf('<svg');
  const end = html.lastIndexOf('</svg>');
  if (start < 0 || end < 0 || html.indexOf('<svg', start + 1) >= 0) throw new Error(`unexpected markup in ${c.name}`);
  writeFileSync(new URL(`../../fixtures/${c.name}.svg`, import.meta.url), html.slice(start, end + 6));
}
console.log(`wrote ${cases.length} fixtures`);
