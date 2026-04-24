import {Component} from '@angular/core';
import {InformationContainer} from './information-container/information-container';
import {InteractionContainer} from './interaction-container/interaction-container';
import {SidebarContainer} from './sidebar-container/sidebar-container';

@Component({
  selector: 'shared-mfe-content',
  imports: [
    InformationContainer,
    InteractionContainer,
    SidebarContainer,
  ],
  templateUrl: './mfe-content.html',
  styleUrl: './mfe-content.scss',
})
export class MfeContent {

}
