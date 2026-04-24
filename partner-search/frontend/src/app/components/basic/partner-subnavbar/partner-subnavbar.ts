import {Component} from '@angular/core';
import {MfeSubnavbar} from '@traefik-microstack/shared';

@Component({
  selector: 'partner-subnavbar',
  imports: [MfeSubnavbar],
  templateUrl: './partner-subnavbar.html',
  styleUrl: './partner-subnavbar.scss',
})
export class PartnerSubnavbar {
  navigationItems = [{route: '../search', label: 'Partnersuche'}];
}
