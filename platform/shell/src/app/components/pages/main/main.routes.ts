import {loadRemoteModule} from '@angular-architects/native-federation';
import {Routes} from '@angular/router';
import {ModuleSelection} from './module-selection/module-selection';

export const mainRoutes: Routes = [
  {
    path: 'loans',
    loadComponent: () =>
      loadRemoteModule('loans', './Component').then(m => m.App),
    loadChildren: () =>
      loadRemoteModule('loans', './Routes').then(m => m.routes)},
  {
    path: 'partner',
    loadComponent: () =>
      loadRemoteModule('partner-search', './Component').then(m => m.App),
    loadChildren: () =>
      loadRemoteModule('partner-search', './Routes').then(m => m.routes),
  },
  {
    path: 'partner-edit',
    loadComponent: () =>
      loadRemoteModule('partner-edit', './Component').then(m => m.App),
    loadChildren: () =>
      loadRemoteModule('partner-edit', './Routes').then(m => m.routes),
  },
  {
    path: 'ekf',
    loadComponent: () =>
      loadRemoteModule('ekf', './Component').then(m => m.App),
  },
  {
    path: '**',
    component: ModuleSelection,
  },
];
