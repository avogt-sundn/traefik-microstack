import {Routes} from '@angular/router';
import {ViewPartner} from './components/pages/view-partner/view-partner';

export const routes: Routes = [
  {
    path: 'view/:partnerId',
    component: ViewPartner,
  },
  {
    path: 'view',
    component: ViewPartner,
  },
  {
    path: '**',
    redirectTo: '/partner-search/search',
  },
];
