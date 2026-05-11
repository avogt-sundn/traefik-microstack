import {NgTemplateOutlet} from '@angular/common';
import {Component, computed, contentChildren, signal} from '@angular/core';
import {MatChipListbox, MatChipOption} from '@angular/material/chips';
import {ChipTabItem} from './chip-tab-item';

@Component({
  selector: 'shared-chip-tabs',
  imports: [
    NgTemplateOutlet,
    MatChipListbox,
    MatChipOption,
  ],
  templateUrl: './chip-tabs.html',
  styleUrl: './chip-tabs.scss',
})
export class ChipTabs {
  tabs = contentChildren(ChipTabItem);
  selectedIndex = signal(0);

  currentContent = computed(() => {
    const tab = this.tabs()[this.selectedIndex()];
    return tab?.content() ?? null;
  });

  select(value: number) {
    if (value !== undefined) {
      this.selectedIndex.set(value);
    }
  }
}
