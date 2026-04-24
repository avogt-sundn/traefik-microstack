import ekfDE from './de.json';
import ekfEN from './en.json';
import sharedDE from '../../../../shared/i18n/de.json';
import sharedEN from '../../../../shared/i18n/en.json';
import {provideHybridTranslocoLoader} from '@shared/services/hybrid-transloco-loader.service';

const staticTranslations = new Map([
  [
    'de',
    {  ...sharedDE, ...ekfDE },
  ],
  [
    'en',
    {  ...sharedEN, ...ekfEN},
  ],
]);

export const EkfTranslocoProviders = provideHybridTranslocoLoader(staticTranslations, 'ekf');
