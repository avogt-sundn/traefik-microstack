import {CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, computed, effect, inject, input, InputSignal, model, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatChipsModule} from '@angular/material/chips';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {CypressIdDirective} from '../../../../directives/cypress-id';
import {TableColumn, TableRowData} from '../editable-table.types';

@Component({
  selector: 'shared-column-configuration-chips',
  imports: [
    MatAutocompleteModule,
    FormsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    CdkDropList,
    CdkDrag,
    CypressIdDirective,
    TranslocoPipe,
  ],
  templateUrl: './column-configuration-chips.html',
  styleUrl: './column-configuration-chips.scss',
})
export class ColumnConfigurationChips<T extends TableRowData> {


  readonly searchText = model('');
  readonly inputLabel = input<string>("");
  readonly allColumns: InputSignal<TableColumn<T>[]> = input.required();
  readonly selectedColumnsOutput = output<TableColumn<T>[]>();
  selectedColumns = signal<TableColumn<T>[]>([]);

  protected readonly availableColumns = computed(() => {
    const search = this.searchText().toLowerCase();
    const selected = this.selectedColumns();

    const available = this.allColumns().filter(
      col => !selected.some(s => s.key === col.key),
    );

    return search
      ? available.filter(col => {
        const translatedHeader = this.translocoService.translate(col.header);
        return translatedHeader.toLowerCase().includes(search);
      })
      : available;
  });
  private readonly translocoService = inject(TranslocoService);

  constructor() {
    const columns = this.allColumns;
    effect(() => {
      const visibleColumns = columns().filter(col => !col.hiddenOnInit);
      this.selectedColumns.set([...visibleColumns]);
    });
    effect(() => {
      this.selectedColumnsOutput.emit(this.selectedColumns());
    });
  }

  remove(column: TableColumn<T>): void {
    this.selectedColumns.update(columns =>
      columns.filter(col => col.key !== column.key),
    );
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value;

    if (value && !this.selectedColumns().some(col => col.key === value.key)) {
      this.selectedColumns.update(columns => [
        ...columns,
        value,
      ]);
    }

    this.searchText.set('');
    event.option.deselect();
  }

  drop(event: CdkDragDrop<TableColumn<T>[]>): void {
    this.selectedColumns.update(columns => {
      const reordered = [...columns];
      moveItemInArray(reordered, event.previousIndex, event.currentIndex);
      return reordered;
    });
  }
}
