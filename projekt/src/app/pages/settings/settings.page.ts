import { Component, computed, inject } from '@angular/core';
import {
  AlertController,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuButton,
  IonNote,
  IonRadio,
  IonRadioGroup,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';

import { CharacterService } from '../../core/character/character.service';
import { CharacterSheetService } from '../../core/inventory/character-sheet.service';
import { FlaskService } from '../../core/inventory/flask.service';
import { InventoryService } from '../../core/inventory/inventory.service';
import { LoadoutService } from '../../core/inventory/loadout.service';
import { PhysickService } from '../../core/inventory/physick.service';
import { ThemeMode, ThemeScheme } from '../../core/models/preferences.model';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { ProgressService } from '../../core/progress/progress.service';
import { MenuDockButtonComponent } from '../../components/menu-dock-button/menu-dock-button.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    MenuDockButtonComponent,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonRadioGroup,
    IonRadio,
    IonToggle,
  ],
})
export class SettingsPage {
  protected readonly prefs = inject(PreferencesService);
  protected readonly character = inject(CharacterService);
  private readonly progress = inject(ProgressService);
  private readonly inventory = inject(InventoryService);
  private readonly loadout = inject(LoadoutService);
  private readonly sheet = inject(CharacterSheetService);
  private readonly flask = inject(FlaskService);
  private readonly physick = inject(PhysickService);
  private readonly alertCtrl = inject(AlertController);

  protected setScheme(value: string | undefined): void {
    if (value) this.prefs.setScheme(value as ThemeScheme);
  }

  protected setMode(value: string | undefined): void {
    if (value) this.prefs.setMode(value as ThemeMode);
  }

  protected readonly activeName = computed(
    () => this.character.activeCharacter()?.name ?? 'this character',
  );

  /** Every reset here is scoped to the active Character only. */
  protected resetMap(): void {
    this.confirm(
      'Reset map progress?',
      `This clears every completed marker for "${this.activeName()}". It cannot be undone.`,
      () => this.progress.resetActive(),
    );
  }

  protected resetCharacterSheet(): void {
    this.confirm(
      'Reset inventory & character sheet?',
      `This clears the inventory, the equipped loadout and the attributes for "${this.activeName()}" (the class stays). It cannot be undone.`,
      () => {
        this.inventory.resetActive();
        this.loadout.resetActive();
        this.sheet.resetActive();
        this.flask.resetActive();
        this.physick.resetActive();
      },
    );
  }

  protected resetEverything(): void {
    this.confirm(
      'Reset everything?',
      `This clears the map progress, the inventory, the loadout and the character sheet for "${this.activeName()}". It cannot be undone.`,
      () => {
        this.progress.resetActive();
        this.inventory.resetActive();
        this.loadout.resetActive();
        this.sheet.resetActive();
        this.flask.resetActive();
        this.physick.resetActive();
      },
    );
  }

  private async confirm(
    header: string,
    message: string,
    onConfirm: () => void,
  ): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Reset', role: 'destructive', handler: onConfirm },
      ],
    });
    await alert.present();
  }
}
