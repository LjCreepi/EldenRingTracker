import { Component, input, output } from '@angular/core';
import {
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
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { close, sparkles } from 'ionicons/icons';

import { ReleaseNote } from '../../core/onboarding/release-notes';

/**
 * The one-time "What's New" note shown by AppComponent after an update.
 * See CONTEXT.md → "What's New".
 */
@Component({
  selector: 'app-whats-new',
  templateUrl: './whats-new.component.html',
  styleUrls: ['./whats-new.component.scss'],
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
  ],
})
export class WhatsNewComponent {
  readonly note = input.required<ReleaseNote>();
  readonly dismissed = output<void>();

  constructor() {
    addIcons({ sparkles, close });
  }
}
