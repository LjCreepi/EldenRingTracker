import { Signal, computed, signal } from '@angular/core';

/**
 * The three Character screens (Equipment / Inventory / Status) recreate Elden
 * Ring's multi-column menus. On a narrow screen those columns are stacked into
 * one-thing-at-a-time views so it stays clear *what sits next to what*, rather
 * than a squashed desktop grid.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * To go back to the plain (non-adaptive) layout — e.g. while reworking these
 * screens into something of your own — set this to `false`. Every phone-only
 * rule in the three pages' SCSS is nested under `:host(.compact)`, and each page
 * binds that class to {@link compactLayout}. Flip this one flag and nothing else
 * needs touching; the base layout then renders at every width.
 * See docs/responsive.md → "Character screens".
 * ─────────────────────────────────────────────────────────────────────────────
 */
const COMPACT_CHARACTER_LAYOUT = true;

/** Below this width the stacked layout kicks in (matches the app's `md` split). */
const COMPACT_BREAKPOINT_PX = 768;

const query =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(`(max-width: ${COMPACT_BREAKPOINT_PX - 0.02}px)`)
    : null;

const narrow = signal(query?.matches ?? false);
query?.addEventListener('change', (e) => narrow.set(e.matches));

/**
 * Bind in a component's host: `host: { '[class.compact]': 'compactLayout()' }`.
 * True only when the feature flag is on *and* the viewport is narrow.
 */
export const compactLayout: Signal<boolean> = computed(
  () => COMPACT_CHARACTER_LAYOUT && narrow(),
);
