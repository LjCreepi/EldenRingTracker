import { Component, inject, signal } from '@angular/core';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, checkmarkCircle, close, trashOutline } from 'ionicons/icons';

import { CharacterFormComponent } from '../character-form/character-form.component';
import { CharacterService } from '../../core/character/character.service';
import { CharacterSheetService } from '../../core/inventory/character-sheet.service';
import { FlaskService } from '../../core/inventory/flask.service';
import { InventoryService } from '../../core/inventory/inventory.service';
import { LoadoutService } from '../../core/inventory/loadout.service';
import { PhysickService } from '../../core/inventory/physick.service';
import { startingClass } from '../../core/models/character-sheet.model';
import { MAX_NAME_LENGTH, nameMatchesForConfirm } from '../../features/character/name';
import { ProgressService } from '../../core/progress/progress.service';

/**
 * The Characters screen (a modal opened from the character bar at the top of the
 * menu): switch the active Character, create one, or delete one. Deletion
 * cascades the per-Character stores here, the way SettingsPage orchestrates its
 * resets. See CONTEXT.md → "Character".
 */
@Component({
  selector: 'app-characters',
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    CharacterFormComponent,
  ],
})
export class CharactersComponent {
  protected readonly characters = inject(CharacterService);
  protected readonly sheet = inject(CharacterSheetService);
  private readonly progress = inject(ProgressService);
  private readonly inventory = inject(InventoryService);
  private readonly loadout = inject(LoadoutService);
  private readonly flask = inject(FlaskService);
  private readonly physick = inject(PhysickService);
  private readonly modalCtrl = inject(ModalController);
  private readonly alertCtrl = inject(AlertController);

  protected readonly creating = signal(false);

  constructor() {
    addIcons({ add, checkmarkCircle, close, trashOutline });
  }

  protected className(classId: string): string {
    return startingClass(classId).name;
  }

  protected pick(id: string): void {
    this.characters.setActive(id);
    void this.modalCtrl.dismiss();
  }

  protected onCreate(data: { rawName: string; classId: string }): void {
    this.characters.create(data.rawName, data.classId);
    void this.modalCtrl.dismiss();
  }

  protected async confirmDelete(id: string): Promise<void> {
    const raw = this.characters.rawName(id);
    const shown = this.characters.characters().find((c) => c.id === id)?.name ?? '';
    const alert = await this.alertCtrl.create({
      header: 'Delete character',
      message: `This erases the map progress, inventory, loadout and character sheet for "${shown}". It cannot be undone. Type the name to confirm.`,
      inputs: [
        {
          name: 'name',
          type: 'text',
          attributes: { maxlength: MAX_NAME_LENGTH, autocapitalize: 'off' },
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: (data: { name?: string }) => {
            if (!nameMatchesForConfirm(data.name ?? '', raw)) return false;
            this.remove(id);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private remove(id: string): void {
    this.progress.removeCharacter(id);
    this.inventory.removeCharacter(id);
    this.loadout.removeCharacter(id);
    this.sheet.removeCharacter(id);
    this.flask.removeCharacter(id);
    this.physick.removeCharacter(id);
    this.characters.remove(id);
    // No characters left — the Onboarding Wizard takes over; close this modal.
    if (!this.characters.hasAny()) void this.modalCtrl.dismiss();
  }

  protected close(): void {
    void this.modalCtrl.dismiss();
  }
}
