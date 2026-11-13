// Renders the toolbar and store icons in public/icons from the bookmark
// outline used as the Stow logo on stow.is. Run with `npm run icons`.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const COLOR = "#4f46e5"; // Tailwind indigo-600, as on stow.is
const PATH = "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z";

// Toolbar sizes use a version drawn on a 16px grid so the 2px strokes land
// on whole pixels (32px is the same drawing at 2x, for high-DPI screens).
const TOOLBAR = {
  viewBox: "0 0 16 16",
  stroke: 2,
  path: "M3 3.5A1.5 1.5 0 0 1 4.5 2h7A1.5 1.5 0 0 1 13 3.5V14l-5-2.5L3 14z",
};

// Larger sizes scale the stow.is outline, which spans 20 units (with its
// stroke) centred on (12, 12), to the given artwork size; 128px follows
// Chrome's guidance of 96px of artwork with transparent padding.
function scaled(size, artwork) {
  const units = (20 * size) / artwork;
  const origin = 12 - units / 2;
  return { viewBox: `${origin} ${origin} ${units} ${units}`, stroke: 2, path: PATH };
}

const ICONS = [
  { size: 16, ...TOOLBAR },
  { size: 32, ...TOOLBAR },
  { size: 48, ...scaled(48, 40) },
  { size: 128, ...scaled(128, 96) },
];

function svg({ size, viewBox, stroke, path }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"
    viewBox="${viewBox}" fill="none" stroke="${COLOR}">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="${stroke}" d="${path}" />
  </svg>`;
}

const outDir = resolve(import.meta.dirname, "../public/icons");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

for (const icon of ICONS) {
  await page.setViewportSize({ width: icon.size, height: icon.size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}</style>${svg(icon)}`,
  );
  await page.locator("svg").screenshot({
    path: `${outDir}/icon-${icon.size}.png`,
    omitBackground: true,
  });
  console.log(`icon-${icon.size}.png`);
}

await browser.close();
