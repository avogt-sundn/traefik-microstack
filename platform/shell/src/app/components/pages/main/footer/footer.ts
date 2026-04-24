import {Component} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {TranslocoPipe} from '@jsverse/transloco';

@Component({
  selector: 'shell-footer',
  imports: [
    MatIconModule,
    MatCheckboxModule,
    TranslocoPipe,
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
}
