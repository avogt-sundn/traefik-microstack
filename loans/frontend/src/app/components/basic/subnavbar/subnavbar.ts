import {Component, computed, inject, Signal} from '@angular/core';
import {Router} from '@angular/router';
import {MfeSubnavbar} from '@shared/components/basic/mfe-subnavbar/mfe-subnavbar';

@Component({
  selector: 'loans-subnavbar',
  imports: [MfeSubnavbar],
  templateUrl: './subnavbar.html',
})
export class Subnavbar {

  navigationItems: Signal<{route: string, label: string}[]>

  private readonly router = inject(Router);

  constructor() {
    this.navigationItems = computed(() => {
      const currentUrl = this.router.url;
      const clientMatch = currentUrl.match(/^\/([^\/]+)/);
      const client = clientMatch ? clientMatch[1] : 'abc';

      return [{route: `/${client}/loans/search`, label: 'Vertrag'}];
    });
  }
}
