import { MapLayerId } from '../../core/models/map-layer.model';
import { Marker, MarkerCategoryId } from '../../core/models/marker.model';

/**
 * Pure selection of which Markers to draw: those on `layer` whose category is
 * not currently hidden. Kept free of Leaflet / Angular so it can be unit-tested.
 */
export function visibleMarkers(
  markers: readonly Marker[],
  layer: MapLayerId,
  hiddenCategories: readonly MarkerCategoryId[],
): Marker[] {
  const hidden = new Set(hiddenCategories);
  return markers.filter((m) => m.layer === layer && !hidden.has(m.categoryId));
}
