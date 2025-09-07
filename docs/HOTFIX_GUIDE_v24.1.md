# v24.1 Chrome Android Layout Hotfix – Agent Guide

## Objective
- On Chrome Android (narrow ≤900px), force 1-column and remove horizontal overflow.
- Provide `?nuke=1` (hard no-cache) and `?debug=1` (debug panel).
- Stabilize viewport/safe-area and min-content sizing.

## Branch/PR
- Branch: `hotfix/v24.1-chrome-android-layout`
- PR title: `fix(v24.1): Chrome Android 1-col runtime guard + debug panel + cache-bust`
- Labels: `hotfix`, `mobile`, `chrome-android`

## Steps
1. Update files per this PR (index.html, app.js, sw.js, styles.css).
2. Bump SW `CACHE_NAME = ipwa-cache-v24-1`.
3. Build/Deploy. Immediately verify on a real Android Chrome device via:
   - `https://<host>/?v=24.1&nuke=1&debug=1`
   - Debug panel shows `sw:on`, and `fix:1` when runtime guard applies.
4. If still multi-column, note the root container class from the panel and add that selector to the CSS list.
5. Once CSS fully covers all views, schedule removal of JS guard in next minor.

## Acceptance Criteria
- [ ] On Chrome Android ≤900px width, grid container resolves to `grid-template-columns: 1fr` (or `minmax(0,1fr)`).
- [ ] No horizontal scroll on home and category screens.
- [ ] `?nuke=1` replaces Service Worker and bypasses caches.
- [ ] `?debug=1` panel renders and the `1-Column` button fixes layout instantly.
- [ ] `100dvh/100svh` active; address bar show/hide does not produce layout break.
- [ ] Images/media do not expand tracks (max-width:100%).
- [ ] Text-size adjust does not cause input zoom artifacts (16px+ fonts where applicable).

## Rollback
- Revert branch. SW cache name rollback (e.g., `ipwa-cache-v24-0`) and redeploy with `?nuke=1`.

## Notes
- If the project uses `repeat(auto-fit, minmax(320px, 1fr))`, prefer:
  - `repeat(auto-fill, minmax(min(100%, 320px), 1fr))` or
  - `repeat(auto-fit, minmax(0, 1fr))` and cap children via `max-width`.