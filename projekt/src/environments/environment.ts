// Replaced by `environment.prod.ts` for production builds (see angular.json).

export const environment = {
  production: false,
  /** Human-facing app version. Keep in sync with CHANGELOG.md and package.json. */
  version: '0.6.0',
  /** URLs of the static map data assets (see scripts/prepare-map-assets.mjs). */
  markerCatalogUrl: 'assets/data/marker-catalog.json',
  tileIndexUrl: 'assets/data/map-tiles-index.json',
  /** Static item catalog for the Character menu (see scripts/fetch-item-catalog.mjs). */
  itemCatalogUrl: 'assets/data/item-catalog.json',
};
