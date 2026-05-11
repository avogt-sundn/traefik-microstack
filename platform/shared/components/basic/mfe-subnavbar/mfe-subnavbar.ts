import {Component, input} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'shared-mfe-subnavbar',
  imports: [
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './mfe-subnavbar.html',
  styleUrl: './mfe-subnavbar.scss',
})
export class MfeSubnavbar {
  navigationItems = input<{ route: string, label: string }[]>([]);
}
