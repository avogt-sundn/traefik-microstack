import {Routes} from '@angular/router';
import {PartnerSearch} from './components/pages/partner-search/partner-search';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'search',
    pathMatch: 'full',
  },
  {
    path: 'search',
    component: PartnerSearch,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
