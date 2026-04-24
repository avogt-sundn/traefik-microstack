import {ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';

/**
 * ContractSearchDto Validator
 * Auto-generated from OpenAPI schema
 * Contract search result containing comprehensive contract and related information
 */
export class ContractSearchDtoValidator {
  /**
   * Validates ContractSearchDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return { contractSearchDto: { key: 'forms.validation.dto.objectRequired' } };
    }

    const value = control.value;
    const errors: ValidationErrors = {};



    return Object.keys(errors).length > 0 ? { contractSearchDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return ContractSearchDtoValidator.validate;
  }
}
