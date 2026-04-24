import {Component, input, TemplateRef, viewChild} from '@angular/core';

@Component({
  selector: 'shared-chip-tab-item',
  templateUrl: 'chip-tab-item.html',
})
export class ChipTabItem {
  label = input.required<string>();
  cypressid = input.required<string>();
  content = viewChild<TemplateRef<void>>('contentTemplate');
}
