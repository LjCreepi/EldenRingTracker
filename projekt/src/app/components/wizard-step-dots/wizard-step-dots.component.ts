import { Component, computed, input } from '@angular/core';
import { IonIcon, IonRow } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { ellipse, ellipseOutline } from 'ionicons/icons';

/**
 * A row of dots marking progress through `count` steps, `active` filled in.
 * Renders nothing for zero or one step — a single-panel flow has no progress
 * to show. Used by {@link OnboardingWizardComponent}.
 */
@Component({
  selector: 'app-wizard-step-dots',
  templateUrl: './wizard-step-dots.component.html',
  styleUrls: ['./wizard-step-dots.component.scss'],
  imports: [IonRow, IonIcon],
})
export class WizardStepDotsComponent {
  readonly count = input.required<number>();
  readonly active = input.required<number>();

  protected readonly indices = computed(() =>
    Array.from({ length: this.count() }, (_, i) => i),
  );

  constructor() {
    addIcons({ ellipse, ellipseOutline });
  }
}
