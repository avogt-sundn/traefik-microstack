import {ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideTransloco} from '@jsverse/transloco';
import {environment} from '@loans/src/environments/environment';
import {routes} from './app.routes';
import {LoansTranslocoProviders} from './i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    provideTransloco({
      config: {
        availableLangs: [
          'en',
          'de',
          'fr',
        ],
        defaultLang: 'de',
        fallbackLang: 'de',
        prodMode: environment.production,
        reRenderOnLangChange: true,
      },
    }),

    ...LoansTranslocoProviders,
  ],
};
