import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CharacterService } from '../character/character.service';
import { StorageService } from '../storage/storage.service';
import { ReleaseNote, latestNoteAfter } from './release-notes';

const STORAGE_KEY = 'onboardedVersion';

/**
 * `full`  — brand-new install: app intro, then character creation.
 * `intro` — app intro only (existing save on first run of this build, or the
 *           About screen re-opening it).
 * `create` — character creation only, no skip (the last character was deleted).
 */
export type WizardMode = 'full' | 'intro' | 'create';

/**
 * Drives the Onboarding Wizard and the per-version "What's New" note, off a
 * single stored value: the app version the wizard was last finished at.
 * See CONTEXT.md → "Onboarding Wizard".
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly storage = inject(StorageService);
  private readonly characters = inject(CharacterService);

  private readonly seenVersion = signal<string | null>(
    this.storage.read<string | null>(STORAGE_KEY, null),
  );
  /** The About screen re-opening the intro. */
  private readonly manualIntro = signal(false);

  /** Show the wizard in place of the app shell. */
  readonly needsWizard = computed(
    () =>
      this.manualIntro() ||
      !this.characters.hasAny() ||
      this.seenVersion() === null,
  );

  readonly wizardMode = computed<WizardMode>(() => {
    if (this.manualIntro()) return 'intro';
    if (!this.characters.hasAny()) {
      return this.seenVersion() === null ? 'full' : 'create';
    }
    return 'intro';
  });

  /** The note to show after an update, or null. Never shown with the wizard. */
  readonly whatsNew = computed<ReleaseNote | null>(() => {
    const seen = this.seenVersion();
    if (seen === null || this.needsWizard()) return null;
    return latestNoteAfter(seen);
  });

  /** Wizard finished or skipped, About intro closed, or "What's New" dismissed. */
  markDone(): void {
    this.manualIntro.set(false);
    this.seenVersion.set(environment.version);
    this.storage.write(STORAGE_KEY, environment.version);
  }

  /** From the About screen. */
  openIntro(): void {
    this.manualIntro.set(true);
  }
}
