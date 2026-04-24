import {ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';
import {ContractSearchDtoValidator} from './contract-search-dto-validator';
import {ContractSearchCriteriaSummaryValidator} from './contract-search-criteria-summary-validator';

/**
 * ContractSearchResponse Validator
 * Auto-generated from OpenAPI schema
 * Contract search response with results and metadata
 */
export class ContractSearchResponseValidator {
  /**
   * Validates ContractSearchResponse object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return { contractSearchResponse: { key: 'forms.validation.dto.objectRequired' } };
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('contracts') || value['contracts'] === null || value['contracts'] === undefined || value['contracts'] === '') {
      errors['contracts'] = { key: 'forms.validation.dto.fieldRequired' };
    }

    // Validation for contracts
    if (value.hasOwnProperty('contracts') && value.contracts) {
      // Validate array items
      if (Array.isArray(value['contracts'])) {
        value['contracts'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = ContractSearchDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`contracts[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    // Validation for searchCriteria
    if (value.hasOwnProperty('searchCriteria') && value.searchCriteria) {
      // Validate nested DTO
      const searchCriteriaControl = {value: value['searchCriteria']} as AbstractControl;
      const searchCriteriaErrors = ContractSearchCriteriaSummaryValidator.validate(searchCriteriaControl);
      if (searchCriteriaErrors) {
        errors['searchCriteria'] = searchCriteriaErrors;
      }
    }

    return Object.keys(errors).length > 0 ? { contractSearchResponse: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return ContractSearchResponseValidator.validate;
  }
}
