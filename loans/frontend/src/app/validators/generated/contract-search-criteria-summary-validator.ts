import {ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';

/**
 * ContractSearchCriteriaSummary Validator
 * Auto-generated from OpenAPI schema
 * Summary of search criteria used for contract search
 */
export class ContractSearchCriteriaSummaryValidator {
  /**
   * Validates ContractSearchCriteriaSummary object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return { contractSearchCriteriaSummary: { key: 'forms.validation.dto.objectRequired' } };
    }

    const value = control.value;
    const errors: ValidationErrors = {};



    return Object.keys(errors).length > 0 ? { contractSearchCriteriaSummary: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return ContractSearchCriteriaSummaryValidator.validate;
  }
}
