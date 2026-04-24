import {Component, inject} from '@angular/core';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'cf-shared-feedback-dialog',
  templateUrl: './feedback-dialog.html',
  styleUrls: ['./feedback-dialog.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatFormField,
    MatLabel,
    FormsModule,
    MatInput,
    MatDialogActions,
    MatButton,
  ],
})
export class FeedbackDialog {
  feedback = '';

  private readonly dialogRef = inject(MatDialogRef<FeedbackDialog>)

  onCancel() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.feedback.trim()) {
      this.dialogRef.close(this.feedback.trim());
    }
  }
}
