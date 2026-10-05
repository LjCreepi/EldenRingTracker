import { Component, Input, computed, inject } from '@angular/core';
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  PopoverController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { openOutline } from 'ionicons/icons';

import { MarkerCompletionComponent } from '../marker-completion/marker-completion.component';
import { Marker, MarkerCategory } from '../../core/models/marker.model';
import { ProgressService } from '../../core/progress/progress.service';

/**
 * Content shown when a map marker is tapped — a floating popover on phones, a
 * docked side panel on wide screens (see MapPage). Marking something done/undone
 * changes the item count (an extra status row appears), which used to make the
 * *popover* visibly resize and reposition itself mid-interaction. Simplest fix:
 * in popover mode the popover just closes on the action instead of mutating in
 * place — tap the marker again to see the new state or undo it. The docked
 * panel doesn't have this problem (it never moves), so it stays open.
 */
@Component({
  selector: 'app-marker-detail',
  templateUrl: './marker-detail.component.html',
  styleUrls: ['./marker-detail.component.scss'],
  imports: [
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonIcon,
    MarkerCompletionComponent,
  ],
})
export class MarkerDetailComponent {
  @Input({ required: true }) marker!: Marker;
  @Input({ required: true }) category!: MarkerCategory;
  /** False when hosted in the docked side panel — there is no popover to close. */
  @Input() dismissOnToggle = true;

  private readonly progress = inject(ProgressService);
  private readonly popoverCtrl = inject(PopoverController);

  protected readonly done = computed(() =>
    this.progress.completed().has(this.marker.id),
  );
  // Plain methods, not computed(): they read only @Input fields (no signal),
  // so a computed() here would cache its first value forever instead of
  // reflecting a later @Input change (Angular has no signal to invalidate on).
  /** Marker override → category default → generic fallback. */
  protected actionLabel(): string {
    return (
      this.marker.completion?.action ?? this.category.completion?.action ?? 'Mark as done'
    );
  }
  protected doneStatus(): string {
    return (
      this.marker.completion?.doneStatus ??
      this.category.completion?.doneStatus ??
      'Done'
    );
  }

  /**
   * Image for the popover header: a per-marker illustration if one was matched
   * (bosses), otherwise the authentic item icon for a collectible category —
   * but not the plain placeholder.
   */
  protected headerImage(): string | null {
    if (this.marker.image) return this.marker.image;
    const icon = this.category.icon;
    if (this.category.group && !icon.endsWith('placeholder.svg')) return icon;
    return null;
  }

  /** Optional second step (e.g. a merchant's Bell Bearing). */
  protected bonusStep(): MarkerCategory['bonusStep'] {
    return this.category.bonusStep;
  }
  protected bonusDone(): boolean {
    const step = this.category.bonusStep;
    return step ? this.progress.completed().has(this.stepId(step.id)) : false;
  }

  constructor() {
    addIcons({ openOutline });
  }

  protected toggle(): void {
    this.progress.toggle(this.marker.id);
    this.closeIfPopover();
  }

  protected toggleBonus(): void {
    const step = this.category.bonusStep;
    if (step) this.progress.toggle(this.stepId(step.id));
    this.closeIfPopover();
  }

  private closeIfPopover(): void {
    if (this.dismissOnToggle) void this.popoverCtrl.dismiss();
  }

  private stepId(step: string): string {
    return `${this.marker.id}#${step}`;
  }
}
