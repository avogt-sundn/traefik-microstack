import {Component} from '@angular/core';
import {TranslocoPipe} from '@jsverse/transloco';

@Component({
  selector: 'shell-module-selection',
  imports: [TranslocoPipe],
  templateUrl: './module-selection.html',
  styleUrl: './module-selection.scss',
})
export class ModuleSelection {
}
