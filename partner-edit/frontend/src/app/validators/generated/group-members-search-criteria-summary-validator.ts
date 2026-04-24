import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * GroupMembersSearchCriteriaSummary Validator
 * Auto-generated from OpenAPI schema
 * Summary of search criteria used for this group members search
 */
export class GroupMembersSearchCriteriaSummaryValidator {
  /**
   * Validates GroupMembersSearchCriteriaSummary object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {groupMembersSearchCriteriaSummary: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};



    return Object.keys(errors).length > 0 ? { groupMembersSearchCriteriaSummary: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return GroupMembersSearchCriteriaSummaryValidator.validate;
  }
}
