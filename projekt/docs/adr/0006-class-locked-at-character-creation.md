# Class is chosen at character creation and never changes

## Context

Through 0.4.0 the Status screen let you pick a Character's starting Class from a
dropdown at any time, and picking one reset the eight Attributes to that class's
base spread. `classId` lived on the Character Sheet.

*Elden Ring* itself locks your class in at character creation: it seeds your
starting stats and Level and is never editable afterwards (you respec
*attributes* at Rennala, never your origin). A tracker that lets you swap class
freely drifts from the game it mirrors, and "picking a class wipes your
attributes" is a sharp edge on a screen you otherwise open to *raise* them.

## Decision

`classId` moves from `CharacterSheet` onto `Character`, set once in the creation
flow and exposed nowhere as editable. The Character Sheet is Attributes only.
`CharacterSheetService.setClass()` is gone; resetting the sheet resets the
Attributes to *that Character's* class base.

Existing saves migrate on load: the one auto-created Character copies its sheet's
`classId` (or `vagabond` if it never had a sheet) onto itself, and the stored
sheet keeps only its `attributes`.

## Consequences

- Changing your mind about a class means creating a new Character.
- The migration is one-time and lossless; a leftover `classId` on a stored sheet
  is simply ignored.
- Derived-stat code takes the class from the Character, not the sheet.
