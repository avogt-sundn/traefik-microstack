import {Component, ChangeDetectionStrategy} from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatCardModule} from '@angular/material/card';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'loans-root',
  imports: [
    MatToolbarModule,
    MatCardModule,
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'loans-app',
  },
})
export class App {
}
