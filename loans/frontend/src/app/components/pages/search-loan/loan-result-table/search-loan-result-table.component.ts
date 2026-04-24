import {Component, input, InputSignal} from '@angular/core';
import {MatTableModule} from '@angular/material/table';
import {CommonModule} from '@angular/common';
import {ContractSearchDto} from '../../../../api';
import {TranslocoPipe} from '@jsverse/transloco';

interface TableColumn {
  key: string;
  translationKey: string;
}

@Component({
  selector: 'loans-search-loan-result-table',
  imports: [
    CommonModule,
    MatTableModule,
    TranslocoPipe,
  ],
  templateUrl: './search-loan-result-table.component.html',
  styleUrl: './search-loan-result-table.component.scss',
})
export class SearchLoanResultTable {

  resultTableData: InputSignal<ContractSearchDto[]> = input([{}]);

  columns: TableColumn[] = [
    { key: 'contractNumber', translationKey: 'loans.search.fields.contractNumber' },
    { key: 'partnerNumber', translationKey: 'loans.search.fields.partnerNumber' },
    { key: 'vehicleLicensePlate', translationKey: 'loans.search.fields.license' },
    { key: 'firstName', translationKey: 'loans.search.fields.firstName' },
    { key: 'lastName', translationKey: 'loans.search.fields.lastName' },
    { key: 'street', translationKey: 'forms.fields.street' },
    { key: 'houseNumber', translationKey: 'forms.fields.houseNumber' },
    { key: 'postalCode', translationKey: 'forms.fields.postalCode' },
    { key: 'city', translationKey: 'forms.fields.city' },
  ];
  displayedColumns: string[] = this.columns.map(col => col.key);

}
