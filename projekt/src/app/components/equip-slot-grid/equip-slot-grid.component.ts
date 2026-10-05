import { Component, input, output } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonRow,
  IonThumbnail,
  IonToggle,
} from '@ionic/angular';

import {
  EquipSlotTileComponent,
  SlotView,
} from '../equip-slot-tile/equip-slot-tile.component';
import { ITEM_ICON_PLACEHOLDER, Item } from '../../core/models/item.model';
import { EquipSlotDef, EquipSlotId } from '../../core/models/loadout.model';

export interface SlotGroup {
  readonly group: EquipSlotDef['group'];
  readonly slots: readonly SlotView[];
}

export interface SpellItemView {
  readonly item: Item;
  readonly notHeld: boolean;
}

export interface PhysickTearView {
  readonly item: Item | null;
  readonly notHeld: boolean;
  /** Short effect description, e.g. "+10 Strength for 180s" or the catalog text. */
  readonly effectSummary: string | null;
}

/**
 * The Equipment screen's left column: the slot grid plus the Memorized Spells
 * list. Purely presentational — {@link EquipmentPage} owns the loadout/inventory
 * state and the item-picker modals; this just renders `groups`/`spellItems` and
 * emits the taps that open them.
 */
@Component({
  selector: 'app-equip-slot-grid',
  templateUrl: './equip-slot-grid.component.html',
  styleUrls: ['./equip-slot-grid.component.scss'],
  imports: [
    IonRow,
    IonCol,
    IonIcon,
    IonButton,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonThumbnail,
    IonButtons,
    IonToggle,
    EquipSlotTileComponent,
  ],
})
export class EquipSlotGridComponent {
  readonly groups = input.required<readonly SlotGroup[]>();
  readonly selectedSlot = input.required<EquipSlotId | null>();
  readonly spellItems = input.required<readonly SpellItemView[]>();
  readonly greatRuneName = input.required<string | null>();
  readonly physickTears = input.required<readonly PhysickTearView[]>();
  readonly physickActive = input.required<boolean>();

  readonly openSlot = output<EquipSlotId>();
  readonly openAshOfWar = output<EquipSlotId>();
  readonly openSpellPicker = output<void>();
  readonly removeSpell = output<string>();
  readonly openPhysickTear = output<0 | 1>();
  readonly togglePhysickActive = output<void>();

  protected iconFor(item: Item | null): string {
    return item?.icon ?? ITEM_ICON_PLACEHOLDER;
  }
}
