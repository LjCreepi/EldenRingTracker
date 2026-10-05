import { Component, inject } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { menu } from 'ionicons/icons';

import { PreferencesService } from '../../core/preferences/preferences.service';

/**
 * Toolbar button that re-docks the collapsed side menu (`menuDocked`
 * preference, toggled from the menu header — see AppComponent). Renders
 * nothing once the menu is docked, and is hidden below `md` by CSS: below that
 * breakpoint the menu is always an overlay and the page's own
 * `<ion-menu-button>` already opens it. Sits in the same toolbar slot the
 * hamburger occupies, so nothing jumps around when the menu collapses.
 */
@Component({
  selector: 'app-menu-dock-button',
  imports: [IonButton, IonIcon],
  templateUrl: './menu-dock-button.component.html',
  styleUrls: ['./menu-dock-button.component.scss'],
})
export class MenuDockButtonComponent {
  protected readonly prefs = inject(PreferencesService);

  constructor() {
    addIcons({ menu });
  }
}
