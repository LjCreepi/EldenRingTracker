# Responsive layout

The course brief asks for the app to work across at least two screen dimensions —
phone vs tablet/desktop, and portrait vs landscape. This is how the tracker
handles that, and what was checked.

## What adapts

| Surface | Behaviour |
| --- | --- |
| **Side menu** (`app.component.html`) | `<ion-split-pane when="md">` — an overlay menu on phones (portrait *and* landscape), docked beside the content from **≥ 768 px** (tablet portrait and up). Pinned explicitly rather than left to the default so the split is a deliberate choice. |
| **Map** (`map.page.ts`) | Leaflet runs inside a `ResizeObserver` on the map host: any size change — window resize, split-pane docking/undocking, **device rotation** — triggers `map.invalidateSize()` and, until the user has panned/zoomed, a re-frame to fit the world bounds. `ionViewDidEnter()` does the same on tab re-entry. No separate `orientationchange` handler is needed because the host element itself resizes on rotation. |
| **Viewport** (`index.html`) | `viewport-fit=cover` so the map fills the display cutout / safe-area on notched phones in both orientations. |
| **Browser chrome colour** | `<meta name="theme-color">` is kept in sync with the active colour scheme by `ThemeService`. |
| **Character screens** (`equipment` / `inventory` / `status`) | Each recreates one of Elden Ring's multi-column menus. Below **768 px** the columns stack into one-thing-below-another views (slot grid → item stats → status; item list → item detail) so it stays clear *what sits next to what*. Driven by `core/layout/compact-layout.ts`: a `compactLayout` signal (feature flag `COMPACT_CHARACTER_LAYOUT` AND a `max-width` media query) toggles a `.compact` class on each page host, and every phone-only rule is nested under `:host(.compact)`. Set the flag to `false` to render the plain (non-adaptive) layout at every width — nothing else needs touching. |

## Tested viewports

| Viewport | Device class | Result |
| --- | --- | --- |
| 375 × 667 | phone, portrait | menu is an overlay; map frames to full bounds; marker toggles reachable |
| 844 × 390 | phone, landscape | menu still an overlay; map re-frames on rotation via the `ResizeObserver`; toolbar + content not clipped |
| 820 × 1180 | tablet, portrait | menu docks (≥ 768 px); map fills the remaining pane |
| ≥ 1280 | desktop | menu docked; map fills the remaining pane |
| 390 × 844 | phone, portrait | Character screens stack (slots → item stats → status); no horizontal scroll |
| ≥ 1024 | desktop | Character screens show all columns side by side, per the in-game layout |

Re-check the landscape-phone case (844 × 390) whenever a new full-screen page is
added — that is the tightest layout.
