import { Component, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonRow,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { CharacterFormComponent } from '../character-form/character-form.component';
import { WizardStepDotsComponent } from '../wizard-step-dots/wizard-step-dots.component';
import { CharacterService } from '../../core/character/character.service';
import {
  DEFAULT_CHARACTER_NAME,
  DEFAULT_CLASS_ID,
} from '../../core/models/character.model';
import { OnboardingService } from '../../core/onboarding/onboarding.service';

interface IntroPanel {
  readonly title: string;
  readonly body: string;
}

const INTRO: readonly IntroPanel[] = [
  {
    title: 'Welcome, Tarnished',
    body: 'Track your own run through the Lands Between on an interactive map — bosses, Sites of Grace, dungeons, merchants and collectibles, ticked off as you go. A by-hand inventory, an equipment loadout and a status sheet round it out. Everything is saved on this device; no account, and it works offline.',
  },
  {
    title: 'One run at a time',
    body: 'Progress, inventory and stats all belong to a character. Keep as many as you like and switch between them from the top of the menu. Your starting class is chosen here and then fixed, as in the game — and a character can only ever be renamed at the mirror on the Status screen.',
  },
  {
    title: 'Not everything shows at once',
    body: 'Sites of Grace, bosses, dungeons and merchants are on the map from the start. Rarer finds — Golden Seeds, Crystal Tears, cookbooks and the rest — start switched off. Turn them on from the Markers list in the menu when you’re ready to hunt them.',
  },
];

/**
 * The first-run flow — app intro, then character creation — rendered by
 * AppComponent in place of the app shell while `OnboardingService.needsWizard()`.
 * See CONTEXT.md → "Onboarding Wizard".
 */
@Component({
  selector: 'app-onboarding-wizard',
  templateUrl: './onboarding-wizard.component.html',
  styleUrls: ['./onboarding-wizard.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    CharacterFormComponent,
    WizardStepDotsComponent,
  ],
})
export class OnboardingWizardComponent {
  private readonly onboarding = inject(OnboardingService);
  private readonly characters = inject(CharacterService);

  protected readonly intro = INTRO;
  protected readonly mode = this.onboarding.wizardMode;

  /** The panels this run shows, in order. */
  protected readonly panels = computed<('intro' | 'create')[]>(() => {
    const introPanels = this.intro.map(() => 'intro' as const);
    switch (this.mode()) {
      case 'full':
        return [...introPanels, 'create'];
      case 'create':
        return ['create'];
      default:
        return introPanels;
    }
  });

  protected readonly step = signal(0);
  protected readonly current = computed(() => this.panels()[this.step()]);
  protected readonly introPanel = computed(() => this.intro[this.step()]);
  protected readonly isLast = computed(
    () => this.step() >= this.panels().length - 1,
  );
  protected readonly skippable = computed(() => this.mode() === 'full');

  protected next(): void {
    if (this.isLast()) this.onboarding.markDone();
    else this.step.update((n) => n + 1);
  }

  protected back(): void {
    this.step.update((n) => Math.max(0, n - 1));
  }

  protected skip(): void {
    this.characters.create(DEFAULT_CHARACTER_NAME, DEFAULT_CLASS_ID);
    this.onboarding.markDone();
  }

  protected onCreate(data: { rawName: string; classId: string }): void {
    this.characters.create(data.rawName, data.classId);
    this.onboarding.markDone();
  }
}
