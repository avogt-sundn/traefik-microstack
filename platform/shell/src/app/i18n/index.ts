import shellDE from './de.json';
import shellEN from './en.json';
import shellFR from './fr.json';
import sharedDE from '../../../../shared/i18n/de.json';
import sharedEN from '../../../../shared/i18n/en.json';
import sharedFR from '../../../../shared/i18n/fr.json';
import {provideHybridTranslocoLoader} from '@shared/services/hybrid-transloco-loader.service';

const staticTranslations = new Map([
  [
    'de',
    {...sharedDE, ...shellDE},
  ],
  [
    'en',
    {...sharedEN, ...shellEN},
  ],
  [
    'fr',
    {...sharedFR, ...shellFR},
  ],
]);

export const ShellTranslocoProviders = provideHybridTranslocoLoader(staticTranslations, 'shell');
