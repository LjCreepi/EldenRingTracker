import { MapLayerId } from './map-layer.model';
import { MarkerCategoryId } from './marker.model';

/** One of the two colour schemes required by the project brief. */
export type ThemeScheme = 'erdtree' | 'ash';

/** Light / dark selection; `system` follows the OS setting. */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Per-user view preferences. Not tied to a Character.
 * See CONTEXT.md → "Category Visibility".
 */
export interface Preferences {
  scheme: ThemeScheme;
  mode: ThemeMode;
  activeLayer: MapLayerId;
  /** Categories the user has explicitly switched OFF. */
  hiddenCategories: MarkerCategoryId[];
  /**
   * Categories the user has explicitly switched ON. Only meaningful for
   * `defaultHidden` categories, which are otherwise off. A category in neither
   * list follows its `defaultHidden` flag.
   */
  shownCategories: MarkerCategoryId[];
  /** Ids of Category Groups whose section is collapsed (hidden) in the menu. */
  collapsedGroups: string[];
  /** Group nearby markers of the same category into a counted cluster. */
  clusterMarkers: boolean;
  /**
   * Whether the side menu is docked beside the content on wide viewports
   * (`ion-split-pane`, ≥ md). When false the menu collapses to an overlay opened
   * from the toolbar, on every screen size. Ignored below md, where it is always
   * an overlay.
   */
  menuDocked: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  scheme: 'erdtree',
  mode: 'system',
  activeLayer: 'overworld',
  hiddenCategories: [],
  shownCategories: [],
  collapsedGroups: [],
  clusterMarkers: true,
  menuDocked: true,
};
