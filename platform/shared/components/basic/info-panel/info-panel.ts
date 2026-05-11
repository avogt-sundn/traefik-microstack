import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

export type InfoPanelType = 'info' | 'success' | 'error';

@Component({
  selector: 'shared-info-panel',
  imports: [MatIconModule],
  templateUrl: './info-panel.html',
  styleUrl: './info-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'shared-info-panel',
  },
})
export class InfoPanel {
  readonly type = input<InfoPanelType>('info');
  readonly title = input<string>();
  readonly textItems = input.required<string[]>();
  readonly customIcon = input<string>();

  protected getIcon(): string {
    if (this.customIcon()) {
      return this.customIcon()!;
    }

    switch (this.type()) {
    case 'success':
      return 'check_circle';
    case 'error':
      return 'error';
    case 'info':
    default:
      return 'info';
    }
  }
}
