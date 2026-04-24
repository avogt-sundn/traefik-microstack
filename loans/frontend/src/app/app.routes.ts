import {Routes} from '@angular/router';
import {SearchLoan} from './components/pages/search-loan/search-loan.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'search',
    pathMatch: 'full',
  },
  {
    path: 'search',
    component: SearchLoan,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
