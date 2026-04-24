import {Component, inject, signal, WritableSignal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {TranslocoPipe} from '@jsverse/transloco';
import {MfeContent} from '@shared/components/basic/mfe-content/mfe-content';
import {InfoPanel} from '@shared/components/basic/info-panel/info-panel';
import {
  ValidatedFormField,
} from '@shared/components/basic/validated-form-field/validated-form-field';
import {CypressIdDirective} from '@shared/directives/cypress-id';
import {FormValidationService} from '@shared/services/form-validation.service';
import {ContractDto, ContractSearchDto} from '../../../api';
import {SearchLoanService} from '../../../services/search-loan.service';
import {ApiParameterValidators} from '../../../validators/generated';
import {searchFormValidator} from '../../../validators/validator.constants';
import {Subnavbar} from '../../basic/subnavbar/subnavbar';
import {SearchLoanResultTable} from './loan-result-table/search-loan-result-table.component';

@Component({
  selector: 'loans-search-contract',
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    ValidatedFormField,
    MatButton,
    TranslocoPipe,
    MfeContent,
    InfoPanel,
    Subnavbar,
    SearchLoanResultTable,
    CypressIdDirective,
  ],
  templateUrl: './search-loan.component.html',
})
export class SearchLoan {
  readonly contractNumberValidators = ApiParameterValidators.contractNumberValidators()
  readonly applicationNumberValidators = ApiParameterValidators.applicationNumberValidators()
  readonly partnerNrValidators = ApiParameterValidators.partnerNumberValidators()
  readonly firstNameValidators = ApiParameterValidators.firstNameValidators()
  readonly nameValidators = ApiParameterValidators.nameValidators()
  readonly birthDateValidators = ApiParameterValidators.dateOfBirthValidators()
  readonly postalCodeValidators = ApiParameterValidators.postalCodeValidators()
  readonly cityValidators = ApiParameterValidators.cityValidators()
  readonly licenseValidators = ApiParameterValidators.vehicleLicensePlateValidators()

  resultTableData: WritableSignal<ContractDto[]> = signal([]);
  protected readonly searchForm;
  protected searchPerformed = signal(false);
  private readonly searchLoanService = inject(SearchLoanService);
  private readonly formValidationService = inject(FormValidationService);
  private readonly fb = inject(FormBuilder);

  constructor() {
    this.searchForm = this.fb.group<ContractSearchDto>({
      contractNumber: '',
      applicationNumber: undefined,
      partnerNumber: undefined,
      firstName: '',
      name: '',
      dateOfBirth: '',
      postalCode: '',
      city: '',
      vehicleLicensePlate: '',
    }, {validators: searchFormValidator, updateOn: 'blur'});
  }

  get searchCriteria(): ContractSearchDto {
    return {
      contractNumber: this.searchForm.value.contractNumber || undefined,
      applicationNumber: this.searchForm.value.applicationNumber || undefined,
      partnerNumber: this.searchForm.value.partnerNumber || undefined,
      firstName: this.searchForm.value.firstName || undefined,
      name: this.searchForm.value.name || undefined,
      dateOfBirth: this.searchForm.value.dateOfBirth || undefined,
      postalCode: this.searchForm.value.postalCode || undefined,
      city: this.searchForm.value.city || undefined,
      vehicleLicensePlate: this.searchForm.value.vehicleLicensePlate || undefined,
    };
  }

  resetField(formControlName: string) {
    this.formValidationService.clearField(this.searchForm, formControlName);
  }

  resetForm() {
    this.searchForm.reset();
    this.resultTableData.set([]);
    this.searchPerformed.set(false);
  }

  searchLoan() {
    if (this.formValidationService.validateForm(this.searchForm)) {
      this.searchLoanService.searchLoans(this.searchCriteria).then(contractSearchResponse => {
        this.resultTableData.set([...contractSearchResponse.contracts]);
        this.searchPerformed.set(true);
      });
    }
  }
}
