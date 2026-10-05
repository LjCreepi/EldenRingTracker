import { MapLayerId } from './map-layer.model';

/** Identifier of a Marker Category (e.g. `bosses`, `sites-of-grace`). */
export type MarkerCategoryId = string;

/** Wording of a completion control, phrased in the game's own terms. */
export interface CompletionWording {
  /** Button label while incomplete, e.g. "Mark grace as discovered". */
  readonly action: string;
  /** Status line once complete, e.g. "Lost grace discovered". */
  readonly doneStatus: string;
}

/**
 * A visual section that groups related Marker Categories together in the menu.
 * See CONTEXT.md → "Category Group".
 */
export interface MarkerCategoryGroup {
  readonly id: string;
  readonly name: string;
  /** Asset URL of the icon shown on the group header. */
  readonly icon: string;
}

/**
 * A kind of Marker. Declares whether its Markers count towards progress.
 * See CONTEXT.md → "Marker Category".
 */
export interface MarkerCategory {
  readonly id: MarkerCategoryId;
  readonly name: string;
  /** Asset URL of the icon drawn for every Marker in this category. */
  readonly icon: string;
  /** When true, Markers can be marked complete and contribute to counts. */
  readonly completable: boolean;
  /**
   * Wording of the completion control in the marker detail popover. Falls back
   * to generic text when absent. Only meaningful when `completable`.
   */
  readonly completion?: CompletionWording;
  /**
   * An optional second completion step, tracked separately and *not* counted
   * towards progress — e.g. a Merchant is "found" (the completion) and may
   * later have its Bell Bearing claimed (this step). Recorded under the
   * Completion id `<markerId>#<step id>`. See CONTEXT.md → "Bonus Step".
   */
  readonly bonusStep?: CompletionWording & {
    readonly id: string;
    /** Extra hint shown under the step, e.g. "Requires defeating the merchant." */
    readonly note?: string;
  };
  /** Id of the {@link MarkerCategoryGroup} this category sits under, if any. */
  readonly group?: string;
  /** When true, the category starts hidden until the user switches it on. */
  readonly defaultHidden?: boolean;
}

/**
 * A single point of interest on one Map Layer, drawn from the read-only
 * Marker Catalog. See CONTEXT.md → "Marker".
 *
 * `x` / `y` are pixels on the layer's master tile image at `NATIVE_ZOOM`
 * (origin top-left), unprojected to a Leaflet `LatLng` by the map component.
 */
export interface Marker {
  readonly id: string;
  readonly categoryId: MarkerCategoryId;
  readonly layer: MapLayerId;
  readonly x: number;
  readonly y: number;
  readonly name: string;
  readonly wikiUrl?: string;
  /**
   * Asset URL of an illustration for this specific marker (a boss screenshot),
   * shown in the detail popover. Added by `npm run fetch:images`; absent for
   * markers with no match.
   */
  readonly image?: string;
  /**
   * Overrides the category's `completion` wording for this one marker — e.g. a
   * demigod boss reads "Demigod Felled" where the rest of its category say
   * "Enemy Felled".
   */
  readonly completion?: CompletionWording;
  /**
   * Item Catalog id of the single Item this Marker represents, if any —
   * completing it also adds one to Inventory, un-completing removes one.
   * Only populated for Golden Seed / Sacred Tear markers today; the field is
   * general so other one-Item-per-Marker categories can opt in later.
   */
  readonly itemId?: string;
}

/** The whole catalog as shipped in a single static asset. */
export interface MarkerCatalog {
  /** Bumped whenever the catalog data changes. */
  readonly version: string;
  readonly groups: readonly MarkerCategoryGroup[];
  readonly categories: readonly MarkerCategory[];
  readonly markers: readonly Marker[];
}
