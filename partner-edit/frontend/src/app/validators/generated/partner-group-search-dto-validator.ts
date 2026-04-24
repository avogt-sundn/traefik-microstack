import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * PartnerGroupSearchDto Validator
 * Auto-generated from OpenAPI schema
 * Partner group search result containing comprehensive partner and group information
 */
export class PartnerGroupSearchDtoValidator {
  /**
   * Validates PartnerGroupSearchDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {partnerGroupSearchDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};



    return Object.keys(errors).length > 0 ? { partnerGroupSearchDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return PartnerGroupSearchDtoValidator.validate;
  }
}
