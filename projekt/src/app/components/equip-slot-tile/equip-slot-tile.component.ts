import { Component, input, output } from '@angular/core';
import { IonButton, IonCard, IonIcon, IonText } from '@ionic/angular';

import { ITEM_ICON_PLACEHOLDER, Item } from '../../core/models/item.model';
import { EquipSlotDef } from '../../core/models/loadout.model';

export interface SlotView {
  readonly def: EquipSlotDef;
  readonly item: Item | null;
  readonly ashOfWar: Item | null;
  readonly isArmament: boolean;
  /** Equipped item isn't in the Character's Inventory (build-planning only). */
  readonly itemNotHeld: boolean;
  /** Same, for the slot's Ash of War. */
  readonly ashNotHeld: boolean;
}

/**
 * One Equipment slot tile: the tappable card (icon + name, a flag when the
 * equipped item isn't held) plus its Ash of War button when armament and
 * filled. Used by {@link EquipSlotGridComponent}.
 */
@Component({
  selector: 'app-equip-slot-tile',
  templateUrl: './equip-slot-tile.component.html',
  styleUrls: ['./equip-slot-tile.component.scss'],
  imports: [IonCard, IonText, IonIcon, IonButton],
})
export class EquipSlotTileComponent {
  readonly slot = input.required<SlotView>();
  readonly active = input(false);
  readonly greatRuneName = input<string | null>(null);

  readonly openSlot = output<void>();
  readonly openAshOfWar = output<void>();

  protected iconFor(item: Item): string {
    return item.icon ?? ITEM_ICON_PLACEHOLDER;
  }
}
