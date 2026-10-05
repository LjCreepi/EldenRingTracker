import { Component, inject } from '@angular/core';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuButton,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { environment } from '../../../environments/environment';
import { MenuDockButtonComponent } from '../../components/menu-dock-button/menu-dock-button.component';
import { OnboardingService } from '../../core/onboarding/onboarding.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    MenuDockButtonComponent,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
  ],
})
export class AboutPage {
  private readonly onboarding = inject(OnboardingService);

  protected readonly version = environment.version;

  protected showIntro(): void {
    this.onboarding.openIntro();
  }
}
