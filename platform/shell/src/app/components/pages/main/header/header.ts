import {Component, inject, OnInit, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {ActivatedRoute, RouterLink} from "@angular/router";
import {ClientSelectionService, Client} from "../../client-selection/client-selection.service";
import {MatButtonModule} from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {Router} from '@angular/router';
import {TranslocoPipe} from '@jsverse/transloco';
import {LanguageMenu} from './language-menu/language-menu';

const MODULE_PATH_INDEX = 2;

@Component({
  selector: 'shell-header',
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    TranslocoPipe,
    LanguageMenu,
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header implements OnInit {
  modules = [
    {nameKey: 'app.modules.loans', label: 'loans'},
    {nameKey: 'app.modules.partner-search', label: 'partner'},
    {nameKey: 'app.modules.partner-edit', label: 'partner-edit'},
    {nameKey: 'app.modules.ekf', label: 'ekf'},
  ];
  activeModule = signal<string | null>(null);
  client: Client | undefined;
  private readonly clientSelectionService = inject(ClientSelectionService);
  private readonly router = inject(Router);


  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.client = this.clientSelectionService.getClientByLabel(this.route.snapshot.params['client']);
    if (!this.client) {
      this.router.navigate(['/welcome']);
    }
    this.activeModule.set(window.location.pathname.split('/')?.[MODULE_PATH_INDEX]);
  }
}
