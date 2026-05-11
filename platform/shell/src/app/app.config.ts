import {ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideTransloco} from '@jsverse/transloco';
import {MatTableModule} from '@angular/material/table';
import {routes} from './app.routes';
import {ShellTranslocoProviders} from './i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // Eagerly registers MatTableModule (including @angular/cdk/table providers) in the
    // shell's root injector. The shell loads before any MFE remote, so its bundle wins
    // the singleton race — preventing NG0201 injection token mismatches across remotes.
    importProvidersFrom(MatTableModule),

    provideTransloco({
      config: {
        availableLangs: [
          'en',
          'de',
          'fr',
        ],
        defaultLang: 'de',
        fallbackLang: 'de',
        prodMode: true,
        reRenderOnLangChange: true,
      },
    }),

    ...ShellTranslocoProviders,
  ],
};
