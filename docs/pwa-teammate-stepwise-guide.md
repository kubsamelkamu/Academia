# PWA Task Handoff Guide (Step-by-Step)

This guide is for a teammate who will implement **Progressive Web App (PWA)** support in this project.

## 1) What is a PWA? (Short Description)

A **Progressive Web App (PWA)** is a web app that can feel like a mobile app:

- Installable to home screen/desktop
- Can work offline (or with poor internet) using cached resources
- Uses app icon, app name, and splash-like launch behavior
- Loads fast and provides a reliable user experience

In this project, we will use **`public/favicon.png`** as the PWA icon source for v1.

---

## 2) Git Workflow (Start Here)

### Step 1: Pull latest code from GitHub

```bash
git switch main
git pull origin main
```

### Step 2: Create your own branch

Use a clear branch name:

```bash
git checkout -b feat/pwa-setup
```

### Step 3: Install dependencies and run project

```bash
npm install
npm run dev
```

---

## 3) Implementation Plan (One by One)

## Step 1: Add Web App Manifest

Create `src/app/manifest.ts` and define:

- `name` and `short_name` for Academia
- `start_url` as `/`
- `display` as `standalone`
- `background_color` and `theme_color` from existing theme choices
- `icons` entries that point to `public/favicon.png` for now

> Note: For v1, using one icon source is acceptable. Later we can add dedicated `192x192` and `512x512` files.

## Step 2: Ensure app metadata references manifest

In app metadata (usually `src/app/layout.tsx`):

- Ensure manifest is linked (e.g., `manifest: "/manifest.webmanifest"`)
- Keep metadata consistent with existing app title/description

## Step 3: Add a PWA service worker for offline basics

Create `public/sw.js` with basic caching strategy:

- Cache app shell/static assets on install
- Clean old caches on activate
- Serve cached response first for static assets, then network fallback

Important:

- Do **not** break existing `public/push-sw.js` (used for push notifications)
- Keep `push-sw.js` and `sw.js` separate in v1

## Step 4: Register service worker on client

Create a small client-side component (example: `src/components/providers/pwa-provider.tsx`) that:

- Runs only in browser (`"use client"`)
- Registers `/sw.js` after window load
- Handles registration errors safely (console warning only)

Then include this provider in the app provider tree (for example in `src/app/providers.tsx`).

## Step 5: Validate installability

Check in browser DevTools (Application tab):

- Manifest is detected
- Service worker is active
- No critical installability errors

---

## 4) Testing Checklist

Run checks before pushing:

```bash
npm run lint
npm run build
```

Manual checks:

- App loads normally after PWA changes
- Existing push notification flow still works (`push-sw.js` untouched)
- PWA install prompt appears on supported browsers after requirements are met
- App icon shown for install comes from `public/favicon.png`

---

## 5) Commit and Push

### Step 1: Commit your changes

```bash
git add .
git commit -m "feat: add initial PWA support (manifest + sw + registration)"
```

### Step 2: Push your branch

```bash
git push -u origin feat/pwa-setup
```

### Step 3: Open Pull Request

PR should include:

- Summary of what was implemented
- Files changed
- Screenshots from browser Application tab (manifest + service worker)
- Note that `public/favicon.png` is used as the current PWA icon

---

## 6) Definition of Done (DoD)

Task is complete when all are true:

- [ ] Branch created from latest `feature/chat-integration`
- [ ] `src/app/manifest.ts` added and working
- [ ] `public/sw.js` added and registered
- [ ] Existing `public/push-sw.js` behavior not broken
- [ ] `public/favicon.png` is used in PWA icon config
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Branch pushed and PR opened

---

## 7) Notes for Future Improvement (Not required in this task)

- Add dedicated PWA icons (`192x192`, `512x512`, maskable)
- Add offline fallback page for navigation requests
- Add update prompt when a new service worker version is available
- Tune cache strategy per route/resource type

---

## 8) Browser Verification (Step-by-Step)

Follow these exact steps in Chrome (or Edge):

### Step 1: Run app locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### Step 2: Open DevTools

- Right click page → **Inspect**
- Open **Application** tab

### Step 3: Check Manifest

- In left sidebar, open **Manifest**
- Confirm:
	- App name/short name are shown
	- Start URL is correct
	- Display mode is `standalone`
	- Icon is loaded from `public/favicon.png`

### Step 4: Check Service Worker

- In left sidebar, open **Service Workers**
- Confirm `sw.js` is registered and activated
- Ensure there are no registration errors

### Step 5: Confirm installability

- In Manifest panel, verify installability checks pass
- If browser shows **Install** button/address-bar icon, click it
- Confirm app installs and opens like a standalone app window

### Step 6: Quick offline check

- In DevTools → **Network** tab, set throttling to **Offline**
- Refresh the app
- Confirm cached/static content still loads (at least app shell)

### Step 7: Regression check for push notifications

- Return network to **Online**
- Verify existing push notification related flows are still unaffected
- Ensure `push-sw.js` is still present and not replaced by `sw.js`

### Step 8: Capture evidence for PR

Take screenshots of:

- Application → Manifest panel
- Application → Service Workers panel
- Installed app window (if available)

Attach these screenshots in the PR description.
