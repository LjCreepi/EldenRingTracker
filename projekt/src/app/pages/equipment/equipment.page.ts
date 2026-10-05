import { KeyValuePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonCard,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuButton,
  IonNote,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonText,
  IonThumbnail,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, alertCircle, close, remove, sparkles } from 'ionicons/icons';

import { CharacterStatusComponent } from '../../components/character-status/character-status.component';
import { EquipPickerComponent } from '../../components/equip-picker/equip-picker.component';
import { EquipSlotGridComponent } from '../../components/equip-slot-grid/equip-slot-grid.component';
import { SlotView } from '../../components/equip-slot-tile/equip-slot-tile.component';
import { ItemDetailComponent } from '../../components/item-detail/item-detail.component';
import { MenuDockButtonComponent } from '../../components/menu-dock-button/menu-dock-button.component';
import { ItemCatalogService } from '../../core/catalog/item-catalog.service';
import { CharacterSheetService } from '../../core/inventory/character-sheet.service';
import { InventoryService } from '../../core/inventory/inventory.service';
import { LoadoutService } from '../../core/inventory/loadout.service';
import { PhysickService } from '../../core/inventory/physick.service';
import { compactLayout } from '../../core/layout/compact-layout';
import { GREAT_RUNES } from '../../core/models/character-sheet.model';
import { Item } from '../../core/models/item.model';
import {
  ARMAMENT_SLOTS,
  EQUIP_SLOTS,
  EquipSlotDef,
  EquipSlotId,
} from '../../core/models/loadout.model';
import {
  CRYSTAL_TEAR_ITEM_IDS,
  crystalTearEffectSummary,
} from '../../core/models/physick.model';
import {
  AFFINITY_IDS,
  AFFINITY_NAMES,
  AffinityId,
  ArmamentBuild,
  defaultArmamentBuild,
  maxUpgradeLevel,
  UpgradePath,
} from '../../core/models/weapon-build.model';
import { weaponAttackRating } from '../../features/character/stats';

/**
 * The Equipment screen, in Elden Ring's three-column shape: the slot grid on the
 * left, the selected item's stats in the middle, the live Character Status on
 * the right. On a narrow screen the three stack (see compact-layout.ts).
 * See CONTEXT.md → "Loadout".
 */
@Component({
  selector: 'app-equipment',
  templateUrl: './equipment.page.html',
  styleUrls: ['./equipment.page.scss'],
  host: { '[class.compact]': 'compact()' },
  imports: [
    KeyValuePipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonMenuButton,
    MenuDockButtonComponent,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonToggle,
    EquipSlotGridComponent,
    ItemDetailComponent,
    CharacterStatusComponent,
  ],
})
export class EquipmentPage {
  protected readonly catalog = inject(ItemCatalogService);
  protected readonly loadout = inject(LoadoutService);
  protected readonly inventory = inject(InventoryService);
  protected readonly physick = inject(PhysickService);
  private readonly sheet = inject(CharacterSheetService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);

  protected readonly compact = compactLayout;
  protected readonly greatRunes = GREAT_RUNES;
  protected readonly crystalTearIds = CRYSTAL_TEAR_ITEM_IDS;
  protected readonly affinityIds = AFFINITY_IDS;
  protected readonly affinityNames = AFFINITY_NAMES;

  /** The two Physick Mix slots, each with its Item (or null) and hold status. */
  protected readonly physickTears = computed(() =>
    this.physick.tearIds().map((id) => {
      const item = this.itemOrNull(id ?? undefined);
      return {
        item,
        notHeld: !!id && !this.inventory.has(id),
        effectSummary: item ? crystalTearEffectSummary(item) : null,
      };
    }),
  );

  protected readonly selectedSlot = signal<EquipSlotId | null>(null);

  protected readonly groups = computed(() => {
    const l = this.loadout.loadout();
    const held = this.inventory.held();
    const notHeld = (id: string | undefined): boolean => !!id && !held.has(id);
    const view = (def: EquipSlotDef): SlotView => {
      const itemId = l.slots[def.id];
      const ashId = l.ashesOfWar[def.id];
      return {
        def,
        item: this.itemOrNull(itemId),
        ashOfWar: this.itemOrNull(ashId),
        isArmament: ARMAMENT_SLOTS.includes(def.id),
        itemNotHeld: notHeld(itemId),
        ashNotHeld: notHeld(ashId),
      };
    };
    const order: EquipSlotDef['group'][] = [
      'armaments',
      'ranged',
      'armor',
      'talismans',
      'other',
    ];
    return order.map((group) => ({
      group,
      slots: EQUIP_SLOTS.filter((s) => s.group === group).map(view),
    }));
  });

  protected readonly selectedItem = computed<Item | null>(() => {
    const id = this.selectedSlot();
    if (!id || id === 'great-rune') return null;
    return this.itemOrNull(this.loadout.slot(id));
  });

  /** The selected item is equipped but not in the Inventory. */
  protected readonly selectedNotHeld = computed(() => {
    const it = this.selectedItem();
    return !!it && !this.inventory.has(it.id);
  });

  /** Whether the selected slot is an armament/shield slot with a real weapon `attack` block. */
  protected readonly selectedIsWeapon = computed(() => {
    const id = this.selectedSlot();
    const it = this.selectedItem();
    return !!id && ARMAMENT_SLOTS.includes(id) && !!it?.attack && Object.keys(it.attack).length > 0;
  });

  protected readonly selectedBuild = computed<ArmamentBuild | null>(() => {
    const id = this.selectedSlot();
    const it = this.selectedItem();
    if (!id || !it || !this.selectedIsWeapon()) return null;
    return this.loadout.armamentBuild(id) ?? defaultArmamentBuild(it.id);
  });

  protected readonly selectedMaxUpgradeLevel = computed(() =>
    maxUpgradeLevel(this.selectedBuild()?.upgradePath ?? 'standard'),
  );

  protected readonly selectedAttackRating = computed(() => {
    const it = this.selectedItem();
    const build = this.selectedBuild();
    if (!it || !build) return null;
    const attrs = this.physick.effectiveAttributes(this.sheet.sheet().attributes);
    return weaponAttackRating(it, attrs, build);
  });

  protected readonly greatRuneName = computed(() => {
    const id = this.loadout.slot('great-rune');
    return this.greatRunes.find((r) => r.id === id)?.name ?? null;
  });

  protected readonly spellItems = computed(() =>
    this.loadout
      .loadout()
      .spells.map((id) => this.catalog.item(id))
      .filter((i): i is Item => !!i)
      .map((item) => ({ item, notHeld: !this.inventory.has(item.id) })),
  );

  constructor() {
    addIcons({ add, alertCircle, close, remove, sparkles });
  }

  private itemOrNull(id: string | undefined): Item | null {
    return id ? this.catalog.item(id) ?? null : null;
  }

  protected async openSlot(id: EquipSlotId): Promise<void> {
    this.selectedSlot.set(id);
    if (id === 'great-rune') return this.pickGreatRune();

    const modal = await this.modalCtrl.create({
      component: EquipPickerComponent,
      componentProps: { slotId: id },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<string | null>();
    if (role === 'equip') this.loadout.equip(id, data ?? null);
  }

  protected async openAshOfWar(slotId: EquipSlotId): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: EquipPickerComponent,
      componentProps: { slotId, ashOfWarFor: slotId },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<string | null>();
    if (role === 'equip') this.loadout.setAshOfWar(slotId, data ?? null);
  }

  protected async openSpellPicker(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: EquipPickerComponent,
      // Memorised spells are a list, not a fixed slot — the picker just needs a
      // category filter, so hand it one directly and a harmless slot id.
      componentProps: {
        slotId: 'spirit-ash' as EquipSlotId,
        categories: ['sorceries', 'incantations'],
      },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<string | null>();
    if (role === 'equip' && data) this.loadout.addSpell(data);
  }

  protected async openPhysickTear(slot: 0 | 1): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: EquipPickerComponent,
      componentProps: {
        slotId: 'spirit-ash' as EquipSlotId, // harmless placeholder; itemIds drives filtering
        itemIds: this.crystalTearIds,
        currentId: this.physick.tearIds()[slot],
      },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<string | null>();
    if (role === 'equip') this.physick.setTear(slot, data ?? null);
  }

  protected setUpgradeLevel(delta: number): void {
    const slot = this.selectedSlot();
    const build = this.selectedBuild();
    if (!slot || !build) return;
    const level = Math.max(
      0,
      Math.min(maxUpgradeLevel(build.upgradePath), build.upgradeLevel + delta),
    );
    this.loadout.setArmamentBuild(slot, { ...build, upgradeLevel: level });
  }

  protected setUpgradePath(path: UpgradePath): void {
    const slot = this.selectedSlot();
    const build = this.selectedBuild();
    if (!slot || !build) return;
    const upgradeLevel = Math.min(build.upgradeLevel, maxUpgradeLevel(path));
    this.loadout.setArmamentBuild(slot, { ...build, upgradePath: path, upgradeLevel });
  }

  protected setAffinity(affinity: AffinityId): void {
    const slot = this.selectedSlot();
    const build = this.selectedBuild();
    if (!slot || !build) return;
    this.loadout.setArmamentBuild(slot, { ...build, affinity });
  }

  protected toggleTwoHanded(): void {
    const slot = this.selectedSlot();
    const build = this.selectedBuild();
    if (!slot || !build) return;
    this.loadout.setArmamentBuild(slot, { ...build, twoHanded: !build.twoHanded });
  }

  private async pickGreatRune(): Promise<void> {
    const current = this.loadout.slot('great-rune');
    const alert = await this.alertCtrl.create({
      header: 'Great Rune',
      inputs: [
        { type: 'radio', label: 'None', value: '', checked: !current },
        ...this.greatRunes.map((r) => ({
          type: 'radio' as const,
          label: r.name,
          value: r.id,
          checked: current === r.id,
        })),
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Equip',
          handler: (value: string) =>
            this.loadout.equip('great-rune', value || null),
        },
      ],
    });
    await alert.present();
  }
}
