import { environment } from '../../../environments/environment';

export interface ReleaseNote {
  readonly version: string;
  readonly highlights: readonly string[];
}

/**
 * Player-facing highlights per app version — the "What's New" note shows the
 * newest unseen one after an update. Written for players (what they can now see
 * and do), deliberately separate from the developer notes in `changelog/*.md`.
 * Newest first. See CONTEXT.md → "What's New".
 */
const RELEASE_NOTES: readonly ReleaseNote[] = [
  {
    version: '0.6.0',
    highlights: [
      'Equip a weapon and see its real Attack Rating — pick an Upgrade Level, Upgrade Path, Affinity and whether you’re two-handing it.',
      'Mix a Wondrous Physick from two Crystal Tears on the Equipment screen, and preview its effect against your stats.',
      'Golden Seeds and Sacred Tears you find on the map now land in your Inventory automatically — and the Status screen tracks how many you’ve actually Used to raise your Flask.',
    ],
  },
  {
    version: '0.5.0',
    highlights: [
      'Create several characters and switch between them — tap your character at the top of the menu.',
      'Your starting class is chosen once, when you create a character, and stays put — like the game.',
      'Rename a character any time with the mirror on the Status screen.',
    ],
  },
];

function parts(version: string): number[] {
  return version.split('.').map((n) => Number(n) || 0);
}

/** &minus;1 / 0 / 1, comparing two dotted versions numerically. */
function compareVersions(a: string, b: string): number {
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return Math.sign(d);
  }
  return 0;
}

/**
 * The newest release note strictly newer than `seenVersion` but no newer than
 * the running build — so a fresh install (seen === current) sees nothing, and a
 * note written ahead of its release stays dark until that version ships.
 */
export function latestNoteAfter(seenVersion: string): ReleaseNote | null {
  return (
    RELEASE_NOTES.find(
      (note) =>
        compareVersions(note.version, seenVersion) > 0 &&
        compareVersions(note.version, environment.version) <= 0,
    ) ?? null
  );
}
