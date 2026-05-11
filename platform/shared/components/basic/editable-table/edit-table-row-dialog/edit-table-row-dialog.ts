import {Component, inject} from '@angular/core';
import {AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {TranslocoPipe} from '@jsverse/transloco';
import {ValidatedFormField} from '../../validated-form-field/validated-form-field';
import {EditRowDialogData, TableColumn, TableRowData, PossibleCellValues} from '../editable-table.types';

@Component({
  selector: 'app-edit-table-row-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    TranslocoPipe,
    ValidatedFormField,
  ],
  templateUrl: './edit-table-row-dialog.html',
  styleUrl: './edit-table-row-dialog.scss',
})
export class EditTableRowDialog<T extends TableRowData> {

  columns: TableColumn<T>[];
  editForm: FormGroup;

  private readonly dialogRef = inject(MatDialogRef<EditTableRowDialog<T>>);
  private readonly data = inject<EditRowDialogData<T>>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  constructor() {
    this.columns = this.data.columns;
    this.editForm = this.createEditForm();
  }

  getDialogTitle(): string {
    return this.data.isEditMode ? 'editableTable.editRow' : 'editableTable.addRow';
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    // Mark all fields as touched to trigger validation display
    this.editForm.markAllAsTouched();

    if (this.editForm.valid && !this.editForm.pending) {
      this.dialogRef.close(this.editForm.getRawValue());
    }
  }

  private createEditForm(): FormGroup {
    const controls = this.columns.reduce((acc, column) => {
      const key = String(column.key);
      const value = this.data.rowData[column.key];
      const validators = column.validators ?? [];
      const asyncValidators = column.asyncValidators ?? [];

      acc[key] = [
        value,
        validators,
        asyncValidators,
      ];
      return acc;
    }, {} as Record<string, [PossibleCellValues, ValidatorFn[], AsyncValidatorFn[]]>);

    return this.fb.group(controls);
  }
}
