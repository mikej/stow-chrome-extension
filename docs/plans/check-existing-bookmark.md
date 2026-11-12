# Check for existing bookmark before showing the form

## Context
Today the popup opens straight into a create form populated from the tab's title/URL, then POSTs to `/v1/items`. We want to first ask the backend about the URL:
- **Already saved** → backend returns the existing item (id + details); the form shows those and becomes an edit/update.
- **Not saved** → backend runs its preprocessing (decruft, title cleanup, GitHub/Twitter details…) and returns suggested title/description/url; the form is prefilled and creates on save.

The Rails app (`~/Projects/stow`) has no such endpoint and no update endpoint, so this touches both repos. The old web-based extension flow (`BrowserExtension::BookmarksController#new`) already does exactly this logic server-side and is the model to reuse.

## Step 0
Copy this plan to `docs/plans/check-existing-bookmark.md` in the extension repo so it can be committed. Wait for review before implementing anything else.

## API contract (existing `v1` namespace)

`POST /v1/items/check` — body `{ "item": { "url", "title", "description" } }`, header `Authorization: <token>`
```json
200 { "existing": true,  "item": { "id": 1, "title": "...", "url": "...", "description": "...", ... } }
200 { "existing": false, "item": { "title": "...", "url": "...", "description": "..." } }
```
`PATCH /v1/items/:id` — body `{ "item": { "title", "url", "description" } }` → 200 item JSON, 404 if not the user's item, 422 with errors.

`POST /v1/items` (create) is unchanged.

## Backend (`~/Projects/stow`)
- `config/routes.rb`: extend the existing `v1` block:
  ```ruby
  namespace :v1 do
    match "*path", to: "api#options", via: :options
    resources :items, only: [:create, :update] do
      post :check, on: :collection
    end
    resource :me, only: [:show], controller: "profile"
  end
  ```
- `app/controllers/v1/api_controller.rb`: change `options` to send `Access-Control-Allow-Methods: "GET, POST, PATCH"`. Required because the extension has no `host_permissions`, so PATCH goes through a CORS preflight. Existing clients (iOS Shortcut) are unaffected.
- `app/controllers/v1/items_controller.rb`:
  - `check`: build `current_user.items.build(url:, type: "Bookmark")`, run `BrowserExtension::BookmarkPreprocessor.process(item, BrowserExtension::ItemData.new(title/description params))` (same as `BrowserExtension::BookmarksController#new`), then call `item.possible_duplicate?`. The check runs after preprocessing because some steps rewrite the URL. Render the existing duplicate or the unsaved processed item.
  - `update`: `current_user.items.find(params[:id]).update(item_params)`, then render the item or a 422. `item_params` already permits title/url/description.
- Views: `app/views/v1/items/check.json.jbuilder` sets `json.existing` and `json.item`. It reuses the `items/_item` partial for the existing case and returns only title/url/description for the new case. `update` renders `show` (already `items/_item`).
- Specs: `spec/requests/v1/items_request_spec.rb` should cover:
  - check without a token returns 401
  - check returns `existing: true` and the id for a saved URL
  - check returns processed fields for a new URL
  - update changes the fields
  - update returns 404 for another user's item
  - OPTIONS lists PATCH

## Extension (this repo)
- `src/config.ts`: add `getCheckItemApiUrl()` → `${base}/v1/items/check` and `getItemApiUrl(id)` → `${base}/v1/items/${id}`. Extend `src/config.test.ts`.
- `src/App.tsx`:
  - Add a `CheckResult` type (`{ existing: true; item: {id,title,url,description} } | { existing: false; item: {title,url,description} }`). Add `checkBookmark(apiKey, url, title)` and `updateBookmark(apiKey, id, …)` helpers next to the existing `callStowApi`, which stays for create.
  - New state `lookup`: `loading | { result: CheckResult } | fallback`. A `useEffect` runs the check and uses an `ignore` flag in its cleanup to handle the StrictMode double-run and stale responses.
    - Any failure (network error, non-2xx, bad JSON) → `fallback`.
    - Empty URL → skip the call and go straight to create mode with the tab values (no fallback marker).
  - DevPanel currently updates `currentTitle`/`currentUrl` on every keystroke. To avoid a check per keystroke, track separate "applied" values. Set them from the initial props and on DevPanel's Apply, and key the check effect on `[storedApiKey, appliedUrl, appliedTitle]`.
  - Render:
    - While loading: a card the same width as the form, with a `Loader2` (lucide, `animate-spin`) and "Checking Stow…".
    - Then: `<BookmarkForm key={…} …>` with `initial` values, `mode: "create" | "edit"`, `fallback: boolean` and `onSave`. The `key` remounts the form when the lookup result changes, which replaces the two `useEffect`s that sync `tabTitle`/`tabUrl` into state.
- `BookmarkForm` changes:
  - Edit mode:
    - header "Edit bookmark" / "Already saved in Stow."
    - button "Update" ("Updating…" while saving)
    - save sends PATCH `/v1/items/:id`
    - error text "Unable to update bookmark. Try again."
  - Create mode works as before, except the initial values come from the check response.
  - Fallback: a small amber `TriangleAlert` icon next to the heading, with `title`/`aria-label` "Couldn't check Stow – using page details". The failed check is visible, and saving still works.
  - Call `maybeCloseWindow()` after a successful update as well.

## Tests (`src/App.test.tsx`)
- Update the existing bookmark tests. The first `fetch` is now the check call, so sequences built with `mockResolvedValueOnce` need a check response first (e.g. the "clears the error before retrying" test).
- Add tests for:
  - The loading spinner shows while the check is pending.
  - `existing: true` → "Edit bookmark" shows, the fields hold the returned values, and Update sends PATCH to `https://stow.is/v1/items/1`.
  - `existing: false` → the fields hold the processed title/description, and Save POSTs to `/v1/items`.
  - The check returns 500 → the fallback icon is visible (found by its aria-label), the fields hold the tab values, and Save still works.

## Verification
- Backend:
  - Run `bundle exec rspec spec/requests/v1`.
  - With `bin/dev` running, call `curl -X POST localhost:3000/v1/items/check -H "Authorization: <token>" -H "Content-Type: application/json" -d '{"item":{"url":"…","title":"…"}}'` for a saved URL and for a new one.
  - Run `curl -X OPTIONS` to confirm PATCH is allowed.
- Extension:
  - Run `npm run test:unit`, `npm run lint` and `npm run build`.
  - Run `npm run dev` (it uses `localhost:3000` from `.env.development`) and check three cases:
    - `?url=` set to an already-saved URL → edit form, and the update persists.
    - A new URL → processed prefill, and saving creates the item.
    - Rails server stopped → the fallback icon appears and the form uses the tab values.
- Run `npm run test:e2e` to confirm it still passes (the setup-form path is unchanged).
