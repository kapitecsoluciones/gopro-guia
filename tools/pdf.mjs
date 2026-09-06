// Genera docs/guia-gopro.pdf desde docs/index.html con Playwright (chromium headless shell ya instalado en la Mac).
import { chromium } from '/Users/javierenriquez/work/kapi-manual/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = 'file://' + path.join(root, 'docs', 'index.html');
const out = path.join(root, 'docs', 'guia-gopro.pdf');
const browser = await chromium.launch({executablePath:'/Users/javierenriquez/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: out, format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' } });
await browser.close();
console.log('PDF:', out);
