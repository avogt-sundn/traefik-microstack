import {ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideTransloco} from '@jsverse/transloco';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {environment} from '../environments/environment';
import {provideApi} from './api';
import {routes} from './app.routes';
import {PartnerTranslocoProviders} from './i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideApi(environment.apiGatewayUrl),
    provideAnimationsAsync(),

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

    ...PartnerTranslocoProviders,
  ],
};
