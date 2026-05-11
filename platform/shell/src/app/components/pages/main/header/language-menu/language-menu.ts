import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageService } from '../../../../../services/language.service';

@Component({
  selector: 'shell-language-menu',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TranslocoPipe,
  ],
  templateUrl: './language-menu.html',
  styleUrl: './language-menu.scss',
})
export class LanguageMenu {
  readonly languageService = inject(LanguageService);

  switchLanguage(languageCode: string): void {
    this.languageService.updateLanguage(languageCode);
  }

  isActiveLanguage(languageCode: string): boolean {
    return this.languageService.isActiveLanguage(languageCode);
  }
}
