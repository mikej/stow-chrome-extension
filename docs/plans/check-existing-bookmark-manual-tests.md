# Manual tests: check for existing bookmark

Run these before committing the `check-existing-bookmark` branches of both repos (`stow-chrome-extension` and `stow`). The automated tests mock the network, so these checks focus on what they can't cover:

- the real Rails responses
- CORS from a real `chrome-extension://` origin
- the popup closing after a save
- how the form looks

## Setup

1. Rails (`~/Projects/stow`, branch `check-existing-bookmark`): run `bin/dev` (Rails serves on `localhost:3000`). Sidekiq should run too, so created items get processed as usual.
2. Copy your API token from `http://localhost:3000/settings`.
3. Pick test URLs:
   - **A**: a URL that is already saved in your local Stow. Note its title and description.
   - **B**: a URL that isn't saved yet, e.g. `https://example.com/manual-test-1`.
   - **G**: a GitHub repo you haven't saved, e.g. `https://github.com/rails/rails`.

## Part 1: dev mode in a normal tab (quick UI pass)

Run `npm run dev` here (it uses `localhost:3000` from `.env.development`). Open the localhost URL Vite prints, enter the token when asked, and keep DevTools → Network open.

| # | Steps | Expected |
|---|-------|----------|
| 1.1 | Open `?url=<A>&title=Anything` | A brief "Checking Stow…" spinner, then **Edit bookmark** / "Already saved in Stow." with A's *saved* title, description and URL (not "Anything"). The button says **Update**. |
| 1.2 | Change the title and description, then click **Update** | Network shows `PATCH /v1/items/<id>` → 200. Reload the item in the Stow web UI: the changes are saved. |
| 1.3 | Open `?url=<B>&title=Example page` | **Save bookmark** with the title "Example page" and no warning icon. |
| 1.4 | Click **Save** | `POST /v1/items` → 201. The item appears in Stow. Re-open `?url=<B>`: it now shows **Edit bookmark** (1.1 behaviour). |
| 1.5 | Open `?url=<G>&title=GitHub - rails/rails: Ruby on Rails` | The title is prefilled as `rails/rails` and the description as `Ruby on Rails`, so the backend preprocessing is working. |
| 1.6 | Dev panel: type a different URL **without** clicking Apply | No new `/v1/items/check` requests while typing. |
| 1.7 | Click **Apply** | A single check request, then the form updates for the new URL. |
| 1.8 | Throttle the network to "Slow 3G" and reload | The spinner card is visible, the same width as the form, and doesn't jump when the form appears. |
| 1.9 | Stop the Rails server and reload with `?url=<B>` | The form shows the tab title and URL with the amber ⚠ next to "Save bookmark". Hovering it shows "Couldn't check Stow – using page details". Clicking Save shows the inline "Unable to save bookmark" error. |
| 1.10 | Restart Rails. Edit A, set its URL to B's URL, and click **Update** | Check whether Rails rejects the duplicate URL. If it does: the inline error "Unable to update bookmark. Try again." appears and A is unchanged. If it doesn't, note it as follow-up. |
| 1.11 | Open with no `?url=` | A plain **Save bookmark** form with no spinner and no check request. |

## Part 2: as an installed extension (CORS + popup behaviour)

This is the part that tests the PATCH preflight for real, because the request comes from a `chrome-extension://` origin.

1. Build pointing at the local backend: `npx vite build --mode development`. A plain `npm run build` targets `https://stow.is`, which doesn't have the new endpoints yet.
2. In `chrome://extensions`, turn on Developer mode, choose "Load unpacked" and select `dist/` (or reload it if it's already loaded).
3. Open the popup's DevTools: right-click the popup → Inspect.

| # | Steps | Expected |
|---|-------|----------|
| 2.1 | On page A, open the popup (or press Ctrl+Shift+S) | **Edit bookmark** with the saved details. |
| 2.2 | Edit and click **Update** | The Network tab shows an `OPTIONS` preflight that succeeds, then `PATCH` → 200, and **the popup closes**. No CORS errors in the console. The change is saved in Stow. |
| 2.3 | On a new page, open the popup and click **Save** | The prefill comes from the backend, the save works and the popup closes. |
| 2.4 | On a `chrome://` page or the new tab page | Note what happens: either a fallback ⚠ or a form for an unsavable URL. It shouldn't crash or spin forever. |
| 2.5 | Open the popup and close it before the check finishes (use slow throttling) | No errors on the next open. |

## Part 3: regression checks for other clients

| # | Steps | Expected |
|---|-------|----------|
| 3.1 | Run `curl -i -X POST localhost:3000/v1/items -H "Authorization: <token>" -H "Content-Type: application/json" -d '{"url":"https://example.com/manual-test-2","title":"curl test"}'` | 201 with item JSON, same as before (iOS Shortcut path). |
| 3.2 | Repeat 3.1 | 200 with the existing item (duplicate behaviour unchanged). |
| 3.3 | Run the iOS Shortcut once, if convenient | Still saves. This covers the `identify_client` User-Agent change. |
| 3.4 | Save a page through the old web extension flow (`/browser_extension/bookmarks/new?url=…`) | Unchanged. |

## Clean up

Delete the test items (B, `manual-test-2`, G) from your local Stow.
