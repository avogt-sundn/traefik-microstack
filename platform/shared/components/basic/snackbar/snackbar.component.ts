import {Component, Inject, computed} from '@angular/core';
import {MAT_SNACK_BAR_DATA, MatSnackBarRef} from '@angular/material/snack-bar';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';

export type SnackbarType = 'info' | 'success' | 'error';

export interface SnackbarData {
  message: string;
  type: SnackbarType;
  showCloseButton?: boolean;
}

// Assisted by AI
@Component({
  selector: 'shared-snackbar',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './snackbar.component.html',
  styleUrl: './snackbar.component.scss',
  host: {
    'class': 'shared-snackbar',
  },
})
export class SnackbarComponent {
  protected readonly type = computed(() => this.data.type);

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: SnackbarData,
    private snackBarRef: MatSnackBarRef<SnackbarComponent>,
  ) {
  }

  getIcon(): string {
    switch (this.data.type) {
    case 'error':
      return 'error';
    case 'info':
      return 'info';
    case 'success':
      return 'check_circle';
    default:
      return 'info';
    }
  }

  close(): void {
    this.snackBarRef.dismiss();
  }
}
