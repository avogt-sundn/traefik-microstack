import {inject} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';
import {TranslocoService} from '@jsverse/transloco';
import {
  SnackbarComponent,
  SnackbarData,
  SnackbarType,
} from '../components/basic/snackbar/snackbar.component';

// Assisted by AI
export function showSnackbar() {
  const snackBar = inject(MatSnackBar);
  const transloco = inject(TranslocoService);

  const show = (message: string, type: SnackbarType, options?: {
    duration?: number;
    action?: string;
    autoClose?: boolean;
  }) => {
    const data: SnackbarData = {
      message,
      type,
      showCloseButton: options?.autoClose === false,
    };

    const config: MatSnackBarConfig = {
      duration: options?.autoClose === false ? 0 : (options?.duration ?? 5000),
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: [
        `snackbar-${type}`,
        'custom-snackbar',
      ],
      data,
    };

    return snackBar.openFromComponent(SnackbarComponent, config);
  };

  return {
    show,
    showError: (message: string, options?: { duration?: number; action?: string; autoClose?: boolean }) => {
      return show(message, 'error', options);
    },
    showInfo: (message: string, options?: { duration?: number; action?: string; autoClose?: boolean }) => {
      return show(message, 'info', options);
    },
    showSuccess: (message: string, options?: { duration?: number; action?: string; autoClose?: boolean }) => {
      return show(message, 'success', options);
    },
    showValidationError: () => {
      const message = transloco.translate('messages.validationError');
      return show(message, 'error', {autoClose: true});
    },
  };
}
