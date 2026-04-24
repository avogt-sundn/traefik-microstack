import {ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter} from '@angular/router';
import {environment} from '@ekf/src/environments/environment';
import {provideTransloco} from '@jsverse/transloco';
import {routes} from './app.routes';
import {EkfTranslocoProviders} from './i18n';

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

    ...EkfTranslocoProviders,
  ],
};
