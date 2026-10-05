/** The two surfaces of the game world available in this version. */
export type MapLayerId = 'overworld' | 'underground';

/**
 * A self-contained surface of the game world, served as a `{z}/{y}/{x}` tile
 * pyramid over a square master image. Marker `x`/`y` are pixels on that master
 * at {@link NATIVE_ZOOM}. See CONTEXT.md → "Map Layer".
 */
export interface MapLayer {
  readonly id: MapLayerId;
  readonly name: string;
  /** Leaflet tile URL template, relative to the app root. */
  readonly tileUrl: string;
}

/** Tile pyramid geometry (from elden-ring-compass' `map-tiles/manifest.json`). */
export const TILE_SIZE = 256;
export const MASTER_SIZE = 10496;
export const NATIVE_ZOOM = 6;

export const MAP_LAYERS: readonly MapLayer[] = [
  {
    id: 'overworld',
    name: 'Lands Between',
    tileUrl: 'assets/map-tiles/overworld/base/{z}/{y}/{x}.webp',
  },
  {
    id: 'underground',
    name: 'Underground',
    tileUrl: 'assets/map-tiles/underground/base/{z}/{y}/{x}.webp',
  },
];

export function mapLayer(id: MapLayerId): MapLayer {
  const layer = MAP_LAYERS.find((l) => l.id === id);
  if (!layer) throw new Error(`Unknown map layer: ${id}`);
  return layer;
}
