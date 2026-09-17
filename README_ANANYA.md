# Ananya Mondal - Full Integration Package

Generated against LostLink `main` at commit `fc92b900d2d67eaaecd9a8827a22a2baf7c1cc16`.

## Existing Ananya screens replaced

- `app/(tab)/home/index.tsx`
- `app/(tab)/feed/index.tsx`
- `app/(tab)/report/item/[id].tsx`
- `app/(tab)/home/notifications.tsx`

## New/updated frontend services

- `services/api.ts` (shared: environment-based API URL with localhost fallback)
- `services/items.ts` (preserves Tonmoy CRUD functions and adds public discovery/details support)
- `services/notifications.ts` (new)
- `services/conversations.ts` (new small client wrapper for Contact Reporter)

## New notification backend

- `server/routes/notifications.routes.js`
- `server/controllers/notifications.controller.js`
- `server/queries/notifications.queries.js`

## Shared backend files that must be replaced with these complete versions

- `server/routes/items.routes.js`
- `server/controllers/items.controller.js`
- `server/queries/items.queries.js`
- `server/index.js`

The item files preserve create/edit/delete/admin behavior while adding database-backed public Home/Feed discovery, safe reporter details, and current-user claim summary. `server/index.js` also restores the existing items/users/admin/uploads mounts that are missing from the current main file and adds notifications.

## What Ananya can demonstrate

1. Home loads visible item data and unread notification count from APIs.
2. Feed loads visible items, supports Lost/Found filtering and local search over fetched API data, and hides `Hidden` records.
3. Item Details loads a single database item, reporter summary, uploaded image, and current-user claim summary; Contact Reporter uses `POST /api/conversations`.
4. Notifications load from PostgreSQL and persist single-read and mark-all-read actions.
5. Loading, error, empty, retry/refresh, accessibility labels, and cross-screen badge updates are included.

## Before running

Set `EXPO_PUBLIC_API_BASE_URL` to a server URL reachable from the device before the final APK build. The included `services/api.ts` keeps localhost only as a development fallback.
