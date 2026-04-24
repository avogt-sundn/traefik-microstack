import {Translation} from '@jsverse/transloco';
import {provideHybridTranslocoLoader} from "@traefik-microstack/shared";

// Static imports - shared translations bundled into the partner workspace
import sharedDE from './shared-de.json';
import sharedEN from './shared-en.json';
import sharedFR from './shared-fr.json';

const staticTranslations = new Map<string, Translation>([
  [
    'de',
    sharedDE,
  ],
  [
    'en',
    sharedEN,
  ],
  [
    'fr',
    sharedFR,
  ],
]);

export const PartnerTranslocoProviders = provideHybridTranslocoLoader(staticTranslations, 'partner-edit');
