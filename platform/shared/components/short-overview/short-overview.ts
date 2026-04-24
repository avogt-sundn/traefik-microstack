import {Component, input, InputSignal} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {TranslocoPipe} from '@jsverse/transloco';

export interface ShortOverviewField {
  labelTranslationKey: string;
  value: string | number | null | undefined;
}

export interface ShortOverviewSection {
  titleTranslationKey: string;
  fields: ShortOverviewField[];
}

@Component({
  selector: 'cf-shared-short-overview',
  imports: [
    MatCardModule,
    TranslocoPipe,
  ],
  templateUrl: './short-overview.html',
  styleUrl: './short-overview.scss',
})
export class ShortOverview {
  title: InputSignal<string> = input<string>('Kurzübersicht');
  titleTranslationKey: InputSignal<string | undefined> = input<string | undefined>();
  sections: InputSignal<ShortOverviewSection[]> = input.required<ShortOverviewSection[]>();
}
