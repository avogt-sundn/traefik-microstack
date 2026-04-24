import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * PartnerSummaryDto Validator
 * Auto-generated from OpenAPI schema
 * Partner summary information with advisor, sales area, and tracking details
 */
export class PartnerSummaryDtoValidator {
  /**
   * Validates PartnerSummaryDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {partnerSummaryDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('partnerNumber') || value['partnerNumber'] === null || value['partnerNumber'] === undefined || value['partnerNumber'] === '') {
      errors['partnerNumber'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    return Object.keys(errors).length > 0 ? {partnerSummaryDto: errors} : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return PartnerSummaryDtoValidator.validate;
  }
}
