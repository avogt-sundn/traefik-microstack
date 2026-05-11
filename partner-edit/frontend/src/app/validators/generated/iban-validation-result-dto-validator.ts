import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * IbanValidationResultDto Validator
 * Auto-generated from OpenAPI schema
 * Result of IBAN validation including extracted banking details
 */
export class IbanValidationResultDtoValidator {
  /**
   * Validates IbanValidationResultDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {ibanValidationResultDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('isValid') || value['isValid'] === null || value['isValid'] === undefined || value['isValid'] === '') {
      errors['isValid'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    return Object.keys(errors).length > 0 ? {ibanValidationResultDto: errors} : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return IbanValidationResultDtoValidator.validate;
  }
}
