/**
 * Character-name rules. Pure — no Angular, no DOM — so it unit-tests like
 * `features/map/marker-visibility.ts`.
 *
 * *Elden Ring* caps names at 16 characters and masks a secret profanity list
 * with asterisks on display (famously "Knight" → "K***ht"). We keep the cap and
 * a deliberately tiny, hand-written nod to the filter — not the real list. See
 * docs/adr/0007. Censoring is display-only: the raw name is what gets stored.
 */

export const MAX_NAME_LENGTH = 16;

/**
 * The token filter. Case-insensitive substrings; each match is masked with as
 * many asterisks as it had characters. `nig` is intentional — it is what makes
 * "Knight" render as "K***ht", the whole joke. Not FromSoftware's list, not
 * exhaustive, not moderation (docs/adr/0007).
 */
const FILTERED_SUBSTRINGS: readonly string[] = [
  'fuck',
  'shit',
  'cunt',
  'fag',
  'nig',
  'nazi',
  'hitler',
  'rape',
  'kkk',
];

const FILTER_RE = new RegExp(
  `(${FILTERED_SUBSTRINGS.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
  'gi',
);

/** Trim the ends and clamp to the 16-character cap. What actually gets stored. */
export function normalizeName(raw: string): string {
  return raw.trim().slice(0, MAX_NAME_LENGTH);
}

/** A normalized name is valid when something is left after trimming. */
export function isValidName(raw: string): boolean {
  return normalizeName(raw).length > 0;
}

/**
 * The name as shown anywhere in the app: filtered substrings masked with
 * asterisks, everything else untouched. Display only — never store this.
 */
export function censorName(raw: string): string {
  return raw.replace(FILTER_RE, (match) => '*'.repeat(match.length));
}

/**
 * Do two names refer to the same Character for confirmation purposes? Compares
 * the censored forms, so typing either the real name or its masked version
 * ("Knight" or "K***ht") counts as a match. Case- and space-sensitive
 * otherwise, like Discord's "type the name to delete".
 */
export function nameMatchesForConfirm(typed: string, storedRaw: string): boolean {
  return censorName(typed.trim()) === censorName(storedRaw.trim());
}
