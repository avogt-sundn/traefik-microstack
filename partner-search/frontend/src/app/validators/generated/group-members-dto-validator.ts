import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * GroupMembersDto Validator
 * Auto-generated from OpenAPI schema
 * Group member information from CF_GET_GROUP_MEMBERS view
 */
export class GroupMembersDtoValidator {
  /**
   * Validates GroupMembersDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {groupMembersDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};



    return Object.keys(errors).length > 0 ? { groupMembersDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return GroupMembersDtoValidator.validate;
  }
}
