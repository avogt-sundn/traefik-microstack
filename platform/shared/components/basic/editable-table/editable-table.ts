import {
  Component,
  computed,
  effect,
  inject,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  signal,
} from '@angular/core';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog} from '@angular/material/dialog';
import {TranslocoPipe} from '@jsverse/transloco';
import {ColumnConfigurationChips} from './column-configuration-chips/column-configuration-chips';
import {EditRowDialogData, TableColumn, TableRowData} from './editable-table.types';
import {EditTableRowDialog} from './edit-table-row-dialog/edit-table-row-dialog';

/**
 * A reusable editable table component with dialog-based editing.
 * - Supports translation keys as headers for automatic translation
 *
 * @example
 * const columns = signal<TableColumn<MyData>[]>([
 *   {key: 'name', header: 'app.columns.name', type: 'text', validators: [Validators.required]},
 *   {key: 'age', header: 'app.columns.age', type: 'number', validators: [Validators.required]}
 * ]);
 *
 * <shared-editable-table
 *   [columns]="columns()"
 *   [initialData]="data()"
 *   (dataChange)="onDataChange($event)">
 * </shared-editable-table>
 */
@Component({
  selector: 'shared-editable-table',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    ColumnConfigurationChips,
    TranslocoPipe,
  ],
  templateUrl: './editable-table.html',
  styleUrl: './editable-table.scss',
})
export class EditableTable<T extends TableRowData> {

  readonly columns: InputSignal<TableColumn<T>[]> = input.required();
  readonly initialData: InputSignal<T[]> = input<T[]>([]);
  readonly editingDisabled: InputSignal<boolean> = input<boolean>(false);
  readonly hideAddButton: InputSignal<boolean> = input<boolean>(false);
  readonly newRowDefaults: InputSignal<(() => Partial<T>) | undefined> = input<(() => Partial<T>) | undefined>();
  readonly customEditHandler:
    InputSignal<((row: T, index: number) => void) | undefined> = input<((row: T, index: number) => void) | undefined>();
  readonly customAddHandler: InputSignal<(() => void) | undefined> = input<(() => void) | undefined>();
  readonly displayedColumns = computed(() => [
    ...this.configuredColumns().map(col => col.key),
    this.ACTIONS_COLUMN,
  ]);

  dataChange: OutputEmitterRef<T[]> = output<T[]>();

  protected configuredColumns = signal<TableColumn<T>[]>([]);
  protected tableData = signal<T[]>([]);

  private readonly dialog = inject(MatDialog);
  private readonly ACTIONS_COLUMN = 'actions';

  constructor() {
    effect(() => { // TODO find solution without effect [FIT-237, FIT-240]
      const newData = this.initialData();
      this.tableData.set([...newData]);
    }, {allowSignalWrites: true});
  }

  addNewTableRow(initialRowData?: Partial<T>): void {
    const customHandler = this.customAddHandler();
    if (customHandler) {
      customHandler();
      return;
    }
    const defaultsProvider = this.newRowDefaults();
    const defaults = defaultsProvider ? defaultsProvider() : {};
    const mergedInitialData = {...defaults, ...initialRowData};
    const emptyRowData = this.createTableRow(mergedInitialData);

    const dialogData: EditRowDialogData<T> = {
      rowData: emptyRowData,
      columns: this.configuredColumns(),
      isEditMode: false,
    };

    const dialogRef = this.dialog.open(EditTableRowDialog<T>, {
      width: '500px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result: T | null) => {
      if (result) {
        this.tableData.update(data => [
          ...data,
          result,
        ]);
        this.dataChange.emit(this.getTableData());
      }
    });
  }

  deleteTableRow(index: number): void {
    this.tableData.update(data => data.filter((_, i) => i !== index));
    this.dataChange.emit(this.getTableData());
  }

  getTableData(): T[] {
    return this.tableData();
  }

  editTableRow(index: number): void {
    const currentRowData = this.tableData()[index];
    const customHandler = this.customEditHandler();
    // Use custom edit handler if provided
    if (customHandler) {
      customHandler(currentRowData, index);
      return;
    }
    // Otherwise use default dialog
    const dialogData: EditRowDialogData<T> = {
      rowData: currentRowData,
      columns: this.configuredColumns(),
      isEditMode: true,
    };

    const dialogRef = this.dialog.open(EditTableRowDialog<T>, {
      width: '500px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result: T | null) => {
      if (result) {
        this.tableData.update(data => {
          const updated = [...data];
          updated[index] = result;
          return updated;
        });
        this.dataChange.emit(this.getTableData());
      }
    });
  }

  changeCols(cols: TableColumn<T>[]): void {
    this.configuredColumns.set(cols);
  }

  private createTableRow(initialRowData?: Partial<T>): T {
    const rowEntries = this.configuredColumns().map(column => {
      const value = initialRowData?.[column.key] ?? null;
      return [
        column.key,
        value,
      ];
    });
    return Object.fromEntries(rowEntries) as T;
  }
}
