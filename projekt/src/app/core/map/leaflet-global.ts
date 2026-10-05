import * as L from 'leaflet';

/**
 * Bind Leaflet to the global scope.
 *
 * `leaflet.markercluster` (1.5.3) predates ES modules: its factory closes over a
 * free `L` global instead of importing Leaflet. It must run *after* this
 * assignment, so it lives in its own module ({@link ./leaflet}) that imports
 * this one first — `import` statements are hoisted above file-body code, so the
 * assignment cannot share a file with the plugin import.
 */
(globalThis as typeof globalThis & { L: typeof L }).L = L;

export { L };
