import {AsyncValidatorFn, ValidatorFn} from '@angular/forms';

export type PossibleCellValues = string | number | boolean | null | undefined;

export interface TableColumn<T extends TableRowData> {
  key: keyof T & string;
  header: string;
  type: 'text' | 'number' | 'date' | 'select';
  selectOptions?: string[];
  validators?: ValidatorFn[];
  asyncValidators?: AsyncValidatorFn[];
  readonly?: boolean;
  displayFormatter?: (value: string) => string;
  hiddenOnInit?: boolean;
}

export type TableRowData = Record<string, PossibleCellValues>;

export interface EditRowDialogData<T extends TableRowData> {
  rowData: T;
  columns: TableColumn<T>[];
  isEditMode: boolean;
}
