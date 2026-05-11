import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * AddressTypeDto Validator
 * Auto-generated from OpenAPI schema
 * Address type classification information
 */
export class AddressTypeDtoValidator {
  /**
   * Validates AddressTypeDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {addressTypeDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('addressTypeId') || value['addressTypeId'] === null || value['addressTypeId'] === undefined || value['addressTypeId'] === '') {
      errors['addressTypeId'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    return Object.keys(errors).length > 0 ? { addressTypeDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return AddressTypeDtoValidator.validate;
  }
}
