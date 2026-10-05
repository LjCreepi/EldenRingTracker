import { Component, computed, input, output, signal } from '@angular/core';
import {
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonRadio,
  IonRadioGroup,
  IonText,
} from '@ionic/angular';

import {
  DEFAULT_CHARACTER_NAME,
  DEFAULT_CLASS_ID,
} from '../../core/models/character.model';
import {
  ATTRIBUTE_IDS,
  ATTRIBUTE_NAMES,
  STARTING_CLASSES,
} from '../../core/models/character-sheet.model';
import {
  MAX_NAME_LENGTH,
  censorName,
  isValidName,
} from '../../features/character/name';

/**
 * Pick a starting Class and a name — the creation step, shared by the Onboarding
 * Wizard and the "＋ Create" flow on the Characters screen. Emits once; the
 * parent decides what to do with it (the wizard finishes onboarding, the
 * Characters screen dismisses its modal).
 */
@Component({
  selector: 'app-character-form',
  templateUrl: './character-form.component.html',
  styleUrls: ['./character-form.component.scss'],
  imports: [
    IonList,
    IonRadioGroup,
    IonItem,
    IonRadio,
    IonNote,
    IonText,
    IonInput,
    IonButton,
  ],
})
export class CharacterFormComponent {
  readonly submitLabel = input('Begin');
  readonly create = output<{ rawName: string; classId: string }>();

  protected readonly maxLength = MAX_NAME_LENGTH;
  protected readonly classes = STARTING_CLASSES;
  protected readonly defaultClassId = DEFAULT_CLASS_ID;

  protected readonly classId = signal(DEFAULT_CLASS_ID);
  protected readonly name = signal(DEFAULT_CHARACTER_NAME);

  private readonly trimmed = computed(() => this.name().trim());
  protected readonly censored = computed(() => censorName(this.trimmed()));
  protected readonly showCensorHint = computed(
    () => this.censored() !== this.trimmed() && this.censored().length > 0,
  );
  protected readonly valid = computed(() => isValidName(this.name()));

  /** The selected class's starting spread, e.g. "Vig 15  Min 10  End 11 …". */
  protected readonly spread = computed(() => {
    const cls = this.classes.find((c) => c.id === this.classId());
    if (!cls) return '';
    return ATTRIBUTE_IDS.map(
      (id) => `${ATTRIBUTE_NAMES[id].slice(0, 3)} ${cls.attributes[id]}`,
    ).join('   ');
  });

  protected setName(value: unknown): void {
    this.name.set(typeof value === 'string' ? value : '');
  }

  protected submit(): void {
    if (this.valid()) {
      this.create.emit({ rawName: this.name(), classId: this.classId() });
    }
  }
}
