// Renders the Chrome Web Store screenshots (1280x800) and small promo tile
// (440x280) into store/. Run `npm run build` first, then `npm run store-images`.
//
// The popup in each screenshot is the real production build from dist/,
// served through Playwright's request routing, with window.chrome and the
// Stow API stubbed. It's then placed in a generic browser frame over a
// made-up article (on a reserved .example domain).
import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const distDir = resolve(root, "dist");
const outDir = resolve(root, "store");

const POPUP_ORIGIN = "https://popup.test";
const API_TOKEN = "screenshot-token";

const ARTICLE = {
  site: "Tidepool Journal",
  url: "https://tidepool.example/2026/commonplace-book",
  title: "Why I keep a commonplace book – Tidepool Journal",
  heading: "Why I keep a commonplace book",
  byline: "12 October 2026 · 6 min read",
};

const SCENES = [
  {
    file: "screenshot-1-save.png",
    heading: "Save the page you're on to Stow",
    subheading: "Stow suggests a clean title and description for you.",
    apiKey: API_TOKEN,
    check: {
      existing: false,
      item: {
        title: "Why I keep a commonplace book",
        url: ARTICLE.url,
        description:
          "A notebook of quotes, ideas and things worth remembering, and how keeping one changed the way I read.",
      },
    },
  },
  {
    file: "screenshot-2-notes.png",
    heading: "Keep your own notes with it",
    subheading: "Add a note when you save a page, and come back to it any time.",
    apiKey: API_TOKEN,
    check: {
      existing: true,
      item: {
        id: 1,
        title: "Why I keep a commonplace book",
        url: ARTICLE.url,
        description:
          "Good argument for writing quotes down by hand. Try the index-at-the-back idea.",
      },
    },
  },
  {
    file: "screenshot-3-setup.png",
    heading: "Connect it to your Stow account",
    subheading: "Paste the API token from your Stow settings page once, and you're set.",
    apiKey: undefined,
  },
];

const CONTENT_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".json": "application/json",
};

async function serveDist(page) {
  await page.route(`${POPUP_ORIGIN}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const file = resolve(distDir, `.${path === "/" ? "/index.html" : path}`);
    await route.fulfill({
      body: await readFile(file),
      contentType: CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
    });
  });
}

// Screenshot of the real popup in the given state, as a PNG data URL
async function renderPopup(browser, scene) {
  const page = await browser.newPage({
    viewport: { width: 336, height: 600 },
    deviceScaleFactor: 2,
  });
  await serveDist(page);

  await page.addInitScript(
    ({ apiKey, tab }) => {
      window.chrome = {
        storage: {
          local: {
            get: async () => (apiKey ? { apiKey } : {}),
            set: async () => {},
            remove: async () => {},
          },
        },
        tabs: { query: async () => [tab] },
      };
    },
    { apiKey: scene.apiKey, tab: { url: ARTICLE.url, title: ARTICLE.title } },
  );

  await page.route("https://stow.is/v1/**", (route) =>
    route.fulfill({ json: scene.check ?? {} }),
  );

  await page.goto(`${POPUP_ORIGIN}/index.html`);
  const popup = page.locator("#root form");
  await popup.waitFor();
  // let the autofocus ring and fonts settle
  await page.waitForTimeout(300);

  const png = await popup.screenshot({ animations: "disabled" });
  await page.close();
  return `data:image/png;base64,${png.toString("base64")}`;
}

async function iconDataUrl(size) {
  const png = await readFile(resolve(root, `public/icons/icon-${size}.png`));
  return `data:image/png;base64,${png.toString("base64")}`;
}

const FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function sceneHtml(scene, popupSrc, toolbarIcon) {
  return `<!doctype html>
<html><head><style>
  * { box-sizing: border-box; }
  body { margin: 0; width: 1280px; height: 800px; overflow: hidden;
    font-family: ${FONT_STACK}; background: #eef2ff; color: #0a0a0a; }
  .caption { height: 168px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center; }
  .caption h1 { margin: 0; font-size: 40px; font-weight: 700; letter-spacing: -0.02em; color: #1e1b4b; }
  .caption p { margin: 12px 0 0; font-size: 20px; color: #4338ca; }
  .window { position: absolute; left: 80px; right: 80px; top: 168px; bottom: -40px;
    background: #fff; border-radius: 14px 14px 0 0; overflow: hidden;
    box-shadow: 0 24px 60px rgba(30, 27, 75, 0.18), 0 0 0 1px rgba(30, 27, 75, 0.08); }
  .toolbar { height: 56px; display: flex; align-items: center; gap: 14px; padding: 0 18px;
    background: #f5f5f5; border-bottom: 1px solid #e5e5e5; }
  .dots { display: flex; gap: 8px; }
  .dots span { width: 12px; height: 12px; border-radius: 50%; background: #d4d4d4; }
  .address { flex: 1; height: 34px; border-radius: 17px; background: #fff;
    border: 1px solid #e5e5e5; display: flex; align-items: center; padding: 0 16px;
    font-size: 15px; color: #525252; }
  .stow-button { width: 34px; height: 34px; border-radius: 8px; background: #e0e7ff;
    display: flex; align-items: center; justify-content: center; }
  .stow-button img { width: 20px; height: 20px; }
  .article { padding: 48px 0 0 96px; width: 620px; }
  .article .site { font-size: 14px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: #0f766e; }
  .article h2 { margin: 14px 0 10px; font-family: Georgia, "Times New Roman", serif;
    font-size: 38px; line-height: 1.15; font-weight: 700; color: #171717; }
  .article .byline { font-size: 14px; color: #737373; margin-bottom: 26px; }
  .line { height: 12px; border-radius: 6px; background: #e5e5e5; margin-bottom: 14px; }
  .popup { position: absolute; top: 62px; right: 12px; border-radius: 10px; overflow: hidden;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.08); background: #fff; }
  .popup img { display: block; width: 436px; }
</style></head>
<body>
  <div class="caption">
    <h1>${scene.heading}</h1>
    <p>${scene.subheading}</p>
  </div>
  <div class="window">
    <div class="toolbar">
      <div class="dots"><span></span><span></span><span></span></div>
      <div class="address">${ARTICLE.url.replace("https://", "")}</div>
      <div class="stow-button"><img src="${toolbarIcon}" alt=""></div>
    </div>
    <div class="article">
      <div class="site">${ARTICLE.site}</div>
      <h2>${ARTICLE.heading}</h2>
      <div class="byline">${ARTICLE.byline}</div>
      ${[100, 96, 98, 90, 0, 97, 99, 94, 60, 0, 98, 92, 96]
        .map((w) =>
          w ? `<div class="line" style="width:${w}%"></div>` : `<div style="height:14px"></div>`,
        )
        .join("")}
    </div>
    <div class="popup"><img src="${popupSrc}" alt=""></div>
  </div>
</body></html>`;
}

function promoTileHtml(icon) {
  return `<!doctype html>
<html><head><style>
  body { margin: 0; width: 440px; height: 280px; overflow: hidden;
    font-family: ${FONT_STACK}; background: #4f46e5; color: #fff;
    display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .mark { display: flex; align-items: center; gap: 14px; }
  .mark img { width: 64px; height: 64px; }
  .mark span { font-size: 56px; font-weight: 700; letter-spacing: -0.03em; }
  p { margin: 18px 0 0; font-size: 20px; color: #e0e7ff; }
</style></head>
<body>
  <div class="mark"><img src="${icon}" alt=""><span>Stow</span></div>
  <p>Save pages to Stow from your browser</p>
</body></html>`;
}

// the toolbar icon recoloured white, for the indigo promo tile
function whiteIconSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 20 20" fill="none" stroke="#fff">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const toolbarIcon = await iconDataUrl(32);

for (const scene of SCENES) {
  const popupSrc = await renderPopup(browser, scene);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.setContent(sceneHtml(scene, popupSrc, toolbarIcon));
  await page.screenshot({ path: resolve(outDir, scene.file) });
  await page.close();
  console.log(scene.file);
}

const tile = await browser.newPage({ viewport: { width: 440, height: 280 } });
await tile.setContent(promoTileHtml(whiteIconSvg()));
await tile.screenshot({ path: resolve(outDir, "promo-small-440x280.png") });
console.log("promo-small-440x280.png");

await browser.close();
