import {Routes} from '@angular/router';
import {ClientSelection} from './components/pages/client-selection/client-selection';
import {Main} from './components/pages/main/main';
import {mainRoutes} from './components/pages/main/main.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/welcome',
    pathMatch: 'full',
  },
  {
    path: 'welcome',
    component: ClientSelection,
  },
  {
    path: ':client',
    component: Main,
    children: mainRoutes,
  },
  {
    path: '**',
    redirectTo: '/welcome',
  },
];
