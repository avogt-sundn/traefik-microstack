import {inject, Injectable, InjectionToken} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {Translation, TranslocoLoader, TRANSLOCO_LOADER} from '@jsverse/transloco';

export const STATIC_TRANSLATIONS = new InjectionToken<Map<string, Translation>>('STATIC_TRANSLATIONS');
export const MICROFRONTEND_NAME = new InjectionToken<string>('MICROFRONTEND_NAME');

@Injectable()
export class HybridTranslocoLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);
  private readonly staticTranslations = inject(STATIC_TRANSLATIONS);
  private readonly microfrontendName = inject(MICROFRONTEND_NAME);

  getTranslation(lang: string): Observable<Translation> {
    const staticTranslation = this.staticTranslations.get(lang) || this.staticTranslations.get('de') || {};
    return this.http.get<Translation>(`/assets/${this.microfrontendName}/i18n/${lang}.json`).pipe(
      catchError(() => of({} as Translation)),
      map(remoteTranslation => ({...staticTranslation, ...remoteTranslation})),
    );
  }
}

export function provideHybridTranslocoLoader(
  staticTranslations: Map<string, Translation>,
  microfrontendName: string,
) {
  return [
    {
      provide: STATIC_TRANSLATIONS,
      useValue: staticTranslations,
    },
    {
      provide: MICROFRONTEND_NAME,
      useValue: microfrontendName,
    },
    {
      provide: TRANSLOCO_LOADER,
      useClass: HybridTranslocoLoader,
    },
  ];
}
