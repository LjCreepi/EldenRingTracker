import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'map', pathMatch: 'full' },
  {
    path: 'map',
    loadComponent: () => import('./pages/map/map.page').then((m) => m.MapPage),
  },
  {
    path: 'equipment',
    loadComponent: () =>
      import('./pages/equipment/equipment.page').then((m) => m.EquipmentPage),
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./pages/inventory/inventory.page').then((m) => m.InventoryPage),
  },
  {
    path: 'status',
    loadComponent: () =>
      import('./pages/status/status.page').then((m) => m.StatusPage),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about.page').then((m) => m.AboutPage),
  },
  { path: '**', redirectTo: 'map' },
];
