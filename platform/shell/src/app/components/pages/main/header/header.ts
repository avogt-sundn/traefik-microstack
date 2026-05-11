import {Component, inject, OnInit} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {ActivatedRoute} from '@angular/router';
import {ClientSelectionService, Client} from '../../client-selection/client-selection.service';
import {Router} from '@angular/router';
import {TranslocoPipe} from '@jsverse/transloco';
import {LanguageMenu} from './language-menu/language-menu';

@Component({
  selector: 'shell-header',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    TranslocoPipe,
    LanguageMenu,
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header implements OnInit {
  client: Client | undefined;
  private readonly clientSelectionService = inject(ClientSelectionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.client = this.clientSelectionService.getClientByLabel(this.route.snapshot.params['client']);
    if (!this.client) {
      this.router.navigate(['/welcome']);
    }
  }
}
