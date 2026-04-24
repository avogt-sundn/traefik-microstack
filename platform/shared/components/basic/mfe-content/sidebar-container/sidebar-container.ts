import {Component} from '@angular/core';
import {History} from './history/history';

@Component({
  selector: 'shared-sidebar-container',
  imports: [History],
  templateUrl: './sidebar-container.html',
  styleUrl: './sidebar-container.scss',
})
export class SidebarContainer {

}
