import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * PostalCodeAreaFocusDto Validator
 * Auto-generated from OpenAPI schema
 * Postal code area focus information containing regional data and focus indicators
 */
export class PostalCodeAreaFocusDtoValidator {
  /**
   * Validates PostalCodeAreaFocusDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {postalCodeAreaFocusDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('postalCode') || value['postalCode'] === null || value['postalCode'] === undefined || value['postalCode'] === '') {
      errors['postalCode'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    return Object.keys(errors).length > 0 ? {postalCodeAreaFocusDto: errors} : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return PostalCodeAreaFocusDtoValidator.validate;
  }
}
