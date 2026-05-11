import {Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MfeSubnavbar} from '@traefik-microstack/shared';

@Component({
  selector: 'partner-subnavbar',
  imports: [MfeSubnavbar],
  templateUrl: './partner-subnavbar.html',
  styleUrl: './partner-subnavbar.scss',
})
export class PartnerSubnavbar implements OnInit {
  navigationItems: {route: string; label: string}[] = [];
  private readonly router = inject(Router);

  ngOnInit(): void {
    const client = this.router.url.split('/')[1];
    this.navigationItems = [{route: `/${client}/partner-search/search`, label: 'Partnersuche'}];
  }
}
