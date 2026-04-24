import loansDE from './de.json';
import loansEN from './en.json';
import sharedDE from '../../../../shared/i18n/de.json';
import sharedEN from '../../../../shared/i18n/en.json';
import {provideHybridTranslocoLoader} from '@shared/services/hybrid-transloco-loader.service';

const staticTranslations = new Map([
  [
    'de',
    {  ...sharedDE, ...loansDE  },
  ],
  [
    'en',
    {  ...sharedEN, ...loansEN},
  ],
]);

export const LoansTranslocoProviders = provideHybridTranslocoLoader(staticTranslations, 'loans');
