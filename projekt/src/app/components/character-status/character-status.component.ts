import { Component, computed, inject, input } from '@angular/core';
import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonText,
} from '@ionic/angular';

import { ItemCatalogService } from '../../core/catalog/item-catalog.service';
import { CharacterSheetService } from '../../core/inventory/character-sheet.service';
import { FlaskService } from '../../core/inventory/flask.service';
import { LoadoutService } from '../../core/inventory/loadout.service';
import { PhysickService } from '../../core/inventory/physick.service';
import {
  ATTRIBUTE_IDS,
  ATTRIBUTE_NAMES,
  DEFAULT_MEMORY_SLOTS,
} from '../../core/models/character-sheet.model';
import { derivedStats, LOAD_STATE_LABEL } from '../../features/character/stats';

interface StatRow {
  readonly label: string;
  readonly value: string;
  /** Adds the "≈" marker — the value is an estimate, not canonical. */
  readonly approx?: boolean;
  /** A secondary line under the value (the load-weight band). */
  readonly sub?: string;
}

interface StatSection {
  readonly heading?: string;
  readonly rows: readonly StatRow[];
}

/**
 * The "Character Status" panel — attributes plus the derived stats, laid out
 * like Elden Ring's status column. Pure display: it reads the sheet + loadout
 * services directly. Approximated numbers carry a "≈" (docs/adr/0005).
 */
@Component({
  selector: 'app-character-status',
  templateUrl: './character-status.component.html',
  styleUrls: ['./character-status.component.scss'],
  imports: [IonList, IonListHeader, IonItem, IonLabel, IonNote, IonText],
})
export class CharacterStatusComponent {
  private readonly sheetService = inject(CharacterSheetService);
  private readonly loadout = inject(LoadoutService);
  private readonly catalog = inject(ItemCatalogService);
  protected readonly flask = inject(FlaskService);
  protected readonly physick = inject(PhysickService);

  /** Hide the attribute list (the Status page shows its own editable one). */
  readonly hideAttributes = input(false);

  private readonly equippedItems = computed(() =>
    this.loadout
      .equippedItemIds()
      .map((id) => this.catalog.item(id))
      .filter((i): i is NonNullable<typeof i> => !!i),
  );

  private readonly effectiveAttributes = computed(() =>
    this.physick.effectiveAttributes(this.sheetService.sheet().attributes),
  );

  /**
   * Always the *raw* attributes, deliberately — every currently-modeled
   * Physick effect is a Strength/Dexterity/Intelligence/Faith delta, and
   * nothing DerivedStats computes reads those (HP/FP/Stamina/Discovery scale
   * off Vigor/Mind/Endurance/Arcane; Defense/Resistance off Level and armor).
   * `derivedLevel` naively sums every attribute's delta from class base, so
   * feeding it *any* buffed attribute would inflate Level — and with it every
   * Level-derived number — from a buff that should never touch Level at all.
   * Attack Rating is the one place the Physick buff is meant to apply, and it
   * reads `effectiveAttributes` directly (equipment.page.ts), not this.
   */
  private readonly stats = computed(() =>
    derivedStats(this.sheetService.sheet().attributes, this.sheetService.startingClass(), {
      equipped: this.equippedItems(),
    }),
  );

  protected readonly sections = computed<StatSection[]>(() => {
    const s = this.stats();
    const attrs = this.effectiveAttributes();
    const deltas = this.physick.attributeDeltas();
    const spells = this.loadout.loadout().spells.length;

    const out: StatSection[] = [
      {
        rows: [
          { label: 'Level', value: String(s.level) },
          { label: 'Runes for next', value: s.runesForNext.toLocaleString(), approx: true },
          { label: 'Class', value: this.sheetService.startingClass().name },
        ],
      },
    ];

    if (!this.hideAttributes()) {
      out.push({
        rows: ATTRIBUTE_IDS.map((id) => ({
          label: ATTRIBUTE_NAMES[id],
          value: String(attrs[id]),
          sub: deltas[id] ? `+${deltas[id]} Physick` : undefined,
        })),
      });
    }

    out.push({
      rows: [
        { label: 'HP', value: String(s.hp), approx: true },
        { label: 'FP', value: String(s.fp), approx: true },
        { label: 'Stamina', value: String(s.stamina), approx: true },
        {
          label: 'Equip Load',
          value: `${s.equipLoad.current} / ${s.equipLoad.max}`,
          approx: true,
          sub: LOAD_STATE_LABEL[s.equipLoad.state],
        },
        { label: 'Poise', value: String(s.poise) },
        { label: 'Discovery', value: s.discovery.toFixed(1) },
        { label: 'Memory Slots', value: `${spells} / ${DEFAULT_MEMORY_SLOTS}` },
      ],
    });

    out.push({
      heading: 'Flask',
      rows: [
        { label: 'Charges', value: String(this.flask.flaskCharges()) },
        {
          label: 'Potency',
          value: `Tier ${this.flask.flaskPotencyTier()} / ${this.flask.flaskPotencyMaxTier}`,
        },
      ],
    });

    out.push({
      heading: 'Defence & resistance',
      rows: [
        ...Object.entries(s.defense).map(([k, v]) => ({
          label: `Def · ${k}`,
          value: String(v),
          approx: true,
        })),
        ...Object.entries(s.resistance).map(([k, v]) => ({
          label: `Res · ${k}`,
          value: String(v),
          approx: true,
        })),
      ],
    });

    return out;
  });
}
