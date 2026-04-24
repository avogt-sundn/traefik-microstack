import {Component, input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatNavList} from '@angular/material/list';
import {RouterLink} from '@angular/router';


@Component({
  selector: 'shared-mfe-subnavbar',
  imports: [
    MatNavList,
    RouterLink,
    MatButtonModule,
  ],
  templateUrl: './mfe-subnavbar.html',
  styleUrl: './mfe-subnavbar.scss',
})
export class MfeSubnavbar {
  navigationItems = input<{ route: string, label: string }[]>([]);

}
