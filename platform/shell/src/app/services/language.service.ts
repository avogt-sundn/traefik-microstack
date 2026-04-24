import {inject, Injectable, effect} from "@angular/core";
import {CookieService} from "@shared/services/cookie.service";
import {Router} from "@angular/router";
import {TranslocoService} from "@jsverse/transloco";

export interface LanguageOption {
  code: string;
  labelKey: string;
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  readonly availableLanguages: LanguageOption[] = [
    {code: 'de', labelKey: 'header.language.german'},
    {code: 'en', labelKey: 'header.language.english'},
    {code: 'fr', labelKey: 'header.language.french'},
  ];

  private readonly cookieService = inject(CookieService);
  private readonly router = inject(Router);
  private readonly translocoService = inject(TranslocoService);


  constructor() {
    effect(() => {
      const navigation = this.router.lastSuccessfulNavigation();
      if (!navigation) return;
      const queryParams = navigation.extras?.queryParams ?? this.router.parseUrl(this.router.url).queryParams;
      if (!queryParams) return;
      const lang = queryParams?.['lang'] ?? this.cookieService.getCookie('lang') ?? 'de';
      this.translocoService.setActiveLang(lang);
      this.cookieService.setCookie('lang', lang, 30);
      this.updateLanguage(lang);
    });
  }

  updateLanguage(lang: string) {
    this.router.navigate([], {
      queryParams: {lang},
      queryParamsHandling: 'merge',
    });
  }

  isActiveLanguage(lang: string): boolean {
    return this.translocoService.getActiveLang() === lang;
  }
}
