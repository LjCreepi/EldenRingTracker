import { L } from './leaflet-global';
import 'leaflet.markercluster';

/**
 * Leaflet with the marker-cluster plugin applied. Import `L` from here — never
 * straight from `'leaflet'` — anywhere clustering is used, so the plugin is
 * guaranteed to have augmented this exact namespace.
 *
 * Why it matters: the plugin hangs `MarkerClusterGroup` / `markerClusterGroup`
 * off a free `L` global. The dev server keeps a single shared Leaflet instance
 * so it happens to work; the production bundle scope-hoists and minifies, the
 * plugin augments a throwaway object, and `L.markerClusterGroup` comes back
 * undefined -> "X.markerClusterGroup is not a function".
 */
export { L };
