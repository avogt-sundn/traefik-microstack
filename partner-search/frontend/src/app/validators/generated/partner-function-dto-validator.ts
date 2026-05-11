import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * PartnerFunctionDto Validator
 * Auto-generated from OpenAPI schema
 * Partner function information containing function definitions and descriptions
 */
export class PartnerFunctionDtoValidator {
  /**
   * Validates PartnerFunctionDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {partnerFunctionDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('partnerFunctionId') || value['partnerFunctionId'] === null || value['partnerFunctionId'] === undefined || value['partnerFunctionId'] === '') {
      errors['partnerFunctionId'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    return Object.keys(errors).length > 0 ? { partnerFunctionDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return PartnerFunctionDtoValidator.validate;
  }
}
