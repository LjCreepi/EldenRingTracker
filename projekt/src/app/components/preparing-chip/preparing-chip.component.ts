import { Component, computed, input, output } from '@angular/core';
import {
  IonButton,
  IonCard,
  IonIcon,
  IonItem,
  IonLabel,
  IonProgressBar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';

/**
 * The small corner "…is downloading" status pill. Used for the one-time
 * per-version asset warm-ups (map tiles, item icons) — the download runs to
 * completion regardless; the ✕ only hides this.
 */
@Component({
  selector: 'app-preparing-chip',
  imports: [IonCard, IonItem, IonLabel, IonProgressBar, IonButton, IonIcon],
  templateUrl: './preparing-chip.component.html',
  styleUrls: ['./preparing-chip.component.scss'],
  host: { '[style.--stack-index]': 'stackIndex()' },
})
export class PreparingChipComponent {
  readonly label = input('Preparing');
  readonly ratio = input(0);
  /**
   * Position in a vertical stack when more than one chip can be visible at
   * once (the map page can show this alongside the item-art one — both are
   * otherwise fixed to the same spot and render illegibly on top of each
   * other). 0 is closest to the screen edge.
   */
  readonly stackIndex = input(0);
  readonly dismissed = output<void>();

  protected readonly percent = computed(() => Math.round(this.ratio() * 100));

  constructor() {
    addIcons({ close });
  }
}
