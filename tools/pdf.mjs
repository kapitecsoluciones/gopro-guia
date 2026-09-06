// Genera docs/guia-gopro.pdf desde docs/index.html con Playwright (chromium headless shell ya instalado en la Mac).
// Requiere playwright-core instalado en algún lado: PW_CORE=/ruta/a/playwright-core/index.mjs y opcionalmente PW_CHROME=/ruta/al/chrome-headless-shell
const { chromium } = await import(process.env.PW_CORE || 'playwright-core');
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = 'file://' + path.join(root, 'docs', 'index.html');
const out = path.join(root, 'docs', 'guia-gopro.pdf');
const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: out, format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' } });
await browser.close();
console.log('PDF:', out);
