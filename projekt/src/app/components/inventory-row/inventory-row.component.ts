import { Component, computed, input, output } from '@angular/core';
import {
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonNote,
  IonThumbnail,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, chevronForward, remove } from 'ionicons/icons';

import { ITEM_ICON_PLACEHOLDER, Item } from '../../core/models/item.model';

/**
 * One row of the Inventory list: thumbnail, name, a +/- quantity stepper, and
 * the chevron that opens the detail pane. Used by {@link InventoryPage}.
 */
@Component({
  selector: 'app-inventory-row',
  templateUrl: './inventory-row.component.html',
  styleUrls: ['./inventory-row.component.scss'],
  imports: [IonItem, IonThumbnail, IonLabel, IonButtons, IonButton, IonIcon, IonNote],
})
export class InventoryRowComponent {
  readonly item = input.required<Item>();
  readonly active = input(false);
  readonly quantity = input.required<number>();

  /** -1 or +1. */
  readonly adjust = output<number>();
  readonly activate = output<void>();

  protected readonly icon = computed(() => this.item().icon ?? ITEM_ICON_PLACEHOLDER);

  constructor() {
    addIcons({ add, remove, chevronForward });
  }
}
