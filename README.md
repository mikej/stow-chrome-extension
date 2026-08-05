# Chrome/Safari extension for Stow

This is a rewritten browser extension for [Stow](https://stow.is), replacing the [original Chrome extension](https://github.com/mikej/stuff-chrome-extension).

The original extension was built using Manifest v2 and relied on APIs and permissions for accessing the current tab and selected text that are no longer supported in Manifest v3.

## Building for Installation as a Browser Extension

```bash
npm run build
```

## Developing Without Installing as a Browser Extension

For a streamlined development workflow, the extension can be opened directly as a browser tab instead of being installed as an unpacked development extension.

In this mode, a mini form is displayed to provide the details that would normally be obtained through browser APIs when running as an extension (e.g. the current page title and URL).

To do this, run the app with the Vite dev server and open the localhost link in the browser:

```bash
npm run dev
```

Optional query parameters can be used to prefill the form when running outside Chrome:

e.g. http://localhost:5173/?url=https://example.com&title=Example

## Testing

Unit tests (Vitest + React Testing Library):

```bash
npm run test:unit
```

End-to-end extension tests (Playwright):

```bash
npm run test:e2e:install
npm run test:e2e
```
