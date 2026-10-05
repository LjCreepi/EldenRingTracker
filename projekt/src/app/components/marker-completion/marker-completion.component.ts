import { Component, input, output } from '@angular/core';
import { IonButton, IonIcon, IonItem, IonLabel, IonNote } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';

import { CompletionWording } from '../../core/models/marker.model';

export type BonusStep = CompletionWording & { readonly id: string; readonly note?: string };

/**
 * A category's completion controls: the main mark-done/undo button, and — if
 * the category has one — the optional bonus step's own toggle. Used by
 * {@link MarkerDetailComponent}, shown only when the category is completable.
 */
@Component({
  selector: 'app-marker-completion',
  templateUrl: './marker-completion.component.html',
  styleUrls: ['./marker-completion.component.scss'],
  imports: [IonItem, IonLabel, IonNote, IonButton, IonIcon],
})
export class MarkerCompletionComponent {
  readonly done = input.required<boolean>();
  readonly doneStatus = input.required<string>();
  readonly actionLabel = input.required<string>();
  readonly bonusStep = input<BonusStep | undefined>();
  readonly bonusDone = input(false);

  readonly toggleDone = output<void>();
  readonly toggleBonus = output<void>();

  constructor() {
    addIcons({ checkmarkCircle });
  }
}
