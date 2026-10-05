import { Component, computed, input } from '@angular/core';
import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonText,
  IonThumbnail,
} from '@ionic/angular';
import { Item, ITEM_ICON_PLACEHOLDER } from '../../core/models/item.model';

interface StatGroup {
  readonly heading: string;
  readonly rows: readonly { name: string; value: string | number }[];
}

type FactKey = 'weaponCategory' | 'weight' | 'fpCost' | 'hpCost' | 'slots' | 'affinity' | 'skill';

/** A fact's label, and whether `0` is a meaningful value worth showing (vs. "absent"). */
const FACT_FIELDS: readonly { key: FactKey; label: string; zeroOk?: boolean }[] = [
  { key: 'weaponCategory', label: 'Type' },
  { key: 'weight', label: 'Weight', zeroOk: true },
  { key: 'fpCost', label: 'FP cost', zeroOk: true },
  { key: 'hpCost', label: 'HP cost' },
  { key: 'slots', label: 'Memory slots', zeroOk: true },
  { key: 'affinity', label: 'Affinity' },
  { key: 'skill', label: 'Skill' },
];

/**
 * The read-only detail view of one catalog Item — icon, description, effect and
 * whatever in-game stat blocks the catalog carries. Used in the Inventory
 * detail pane, the Add-items sheet and the Equipment centre column.
 * All numbers here are the catalog's own base values (docs/adr/0005).
 */
@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss'],
  host: { '[class.item-detail--compact]': 'compact()' },
  imports: [
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonText,
    IonThumbnail,
  ],
})
export class ItemDetailComponent {
  readonly item = input.required<Item>();
  /** Hide the header thumbnail (the Equipment column is tight on space). */
  readonly compact = input(false);

  protected readonly icon = computed(
    () => this.item().icon ?? ITEM_ICON_PLACEHOLDER,
  );

  protected readonly statGroups = computed<StatGroup[]>(() => {
    const it = this.item();
    const groups: StatGroup[] = [];
    const block = (
      heading: string,
      rec?: Readonly<Record<string, string | number>>,
    ) => {
      if (rec && Object.keys(rec).length) {
        groups.push({
          heading,
          rows: Object.entries(rec).map(([name, value]) => ({ name, value })),
        });
      }
    };
    // "Attack Power" is retired in favour of the real, computed Attack Rating
    // (see the Equipment screen's Weapon Build panel) — this is just the
    // catalog's raw +0/Standard-affinity base values.
    block('Base Attack', it.attack);
    block('Guarded Damage Negation', it.guard);
    block('Damage Negation', it.defense);
    block('Resistance', it.resistance);
    block('Attribute Scaling', it.scaling);
    block('Attributes Required', it.requires);
    return groups;
  });

  protected readonly facts = computed(() => {
    const it = this.item();
    return FACT_FIELDS.flatMap(({ key, label, zeroOk }) => {
      const value = it[key];
      const present = zeroOk ? value != null : !!value;
      return present ? [{ label, value: String(value) }] : [];
    });
  });
}
