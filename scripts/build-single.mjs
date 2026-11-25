// Builds the demo as ONE self-contained HTML file (CSS, JS and fonts inlined),
// for hosts that only accept a single page (e.g. sandboxed previews, email-able demos).
// Usage: node scripts/build-single.mjs  →  single-dist/meridian-careers.html (+ screenshots/)
import { build } from 'vite';
import { readFileSync, writeFileSync, readdirSync, rmSync, cpSync } from 'node:fs';

const outDir = 'single-dist';
rmSync(outDir, { recursive: true, force: true });
await build({
  mode: 'demo',
  logLevel: 'warn',
  build: {
    outDir,
    assetsInlineLimit: 50 * 1024 * 1024,
    cssCodeSplit: false,
    rolldownOptions: { output: { inlineDynamicImports: true } },
  },
});

const assets = readdirSync(`${outDir}/assets`);
const js = assets.filter((f) => f.endsWith('.js'));
if (js.length !== 1) throw new Error(`Expected one JS chunk, got ${js.join(', ')}`);
const css = readFileSync(`${outDir}/assets/${assets.find((f) => f.endsWith('.css'))}`, 'utf8');
const code = readFileSync(`${outDir}/assets/${js[0]}`, 'utf8').replace(/<\/script/gi, '<\\/script');
const favicon = `data:image/svg+xml,${encodeURIComponent(readFileSync('public/favicon.svg', 'utf8'))}`;

const html = `<title>Meridian & Co. Careers</title>
<meta name="description" content="Careers & recruitment portal for the fictional Meridian & Co. — portfolio demonstration by ZC Smart Digital.">
<link rel="icon" href="${favicon}">
<style>${css}</style>
<div id="root"></div>
<script type="module">${code}</script>
`;
writeFileSync(`${outDir}/meridian-careers.html`, html);
cpSync('public/screenshots', `${outDir}/screenshots`, { recursive: true });
console.log(`✓ ${outDir}/meridian-careers.html  ${(html.length / 1024).toFixed(0)} KB`);
