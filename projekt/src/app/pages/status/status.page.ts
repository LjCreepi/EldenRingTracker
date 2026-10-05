import { Component, computed, inject } from '@angular/core';
import {
  AlertController,
  IonButton,
  IonButtons,
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
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, remove } from 'ionicons/icons';

import { CharacterStatusComponent } from '../../components/character-status/character-status.component';
import { MenuDockButtonComponent } from '../../components/menu-dock-button/menu-dock-button.component';
import { CharacterService } from '../../core/character/character.service';
import { CharacterSheetService } from '../../core/inventory/character-sheet.service';
import { FlaskService } from '../../core/inventory/flask.service';
import { compactLayout } from '../../core/layout/compact-layout';
import {
  ATTRIBUTE_IDS,
  ATTRIBUTE_NAMES,
} from '../../core/models/character-sheet.model';
import { MAX_NAME_LENGTH, isValidName } from '../../features/character/name';

/**
 * The Status screen — the editable character sheet. The name and starting Class
 * are set at creation and shown read-only here (the name is renameable only
 * through the Mirror); below, raise the eight Attributes and the panel shows the
 * derived stats live. See CONTEXT.md → "Character Sheet" and docs/adr/0005–0006.
 */
@Component({
  selector: 'app-status',
  templateUrl: './status.page.html',
  styleUrls: ['./status.page.scss'],
  host: { '[class.compact]': 'compact()' },
  imports: [
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
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonText,
    IonIcon,
    CharacterStatusComponent,
  ],
})
export class StatusPage {
  protected readonly sheet = inject(CharacterSheetService);
  protected readonly character = inject(CharacterService);
  protected readonly flask = inject(FlaskService);
  private readonly alertCtrl = inject(AlertController);

  protected readonly compact = compactLayout;

  protected readonly attributeRows = ATTRIBUTE_IDS.map((id) => ({
    id,
    name: ATTRIBUTE_NAMES[id],
  }));

  protected readonly baseAttributes = computed(
    () => this.sheet.startingClass().attributes,
  );

  constructor() {
    addIcons({ add, remove });
  }

  /** The Mirror — the only way to rename a Character (CONTEXT.md → "Mirror"). */
  protected async openMirror(): Promise<void> {
    const active = this.character.activeCharacter();
    if (!active) return;
    const alert = await this.alertCtrl.create({
      header: 'The mirror at the Roundtable Hold',
      message: 'Its surface stills, then ripples. Speak a name.',
      inputs: [
        {
          name: 'name',
          type: 'text',
          // The Censored Name, never the raw one — the mirror shouldn't reveal it.
          placeholder: active.name,
          attributes: { maxlength: MAX_NAME_LENGTH, autocapitalize: 'words' },
        },
      ],
      buttons: [
        { text: 'Leave it', role: 'cancel' },
        {
          text: 'Take the name',
          handler: (data: { name?: string }) => {
            // Blank means "keep the current name" — just close.
            if (isValidName(data.name ?? '')) {
              this.character.rename(active.id, data.name ?? '');
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }
}
