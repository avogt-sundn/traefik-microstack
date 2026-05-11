import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {IS_DEV_BUILD} from '../environments/build-mode';

@Component({
  selector: 'partner-edit-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'partner-edit-app',
  },
})
export class App {
  readonly devMode = IS_DEV_BUILD;
}
