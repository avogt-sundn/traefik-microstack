import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * PartnerGroupSearchCriteriaSummary Validator
 * Auto-generated from OpenAPI schema
 * Summary of search criteria used for this group search
 */
export class PartnerGroupSearchCriteriaSummaryValidator {
  /**
   * Validates PartnerGroupSearchCriteriaSummary object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {partnerGroupSearchCriteriaSummary: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};



    return Object.keys(errors).length > 0 ? { partnerGroupSearchCriteriaSummary: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return PartnerGroupSearchCriteriaSummaryValidator.validate;
  }
}
