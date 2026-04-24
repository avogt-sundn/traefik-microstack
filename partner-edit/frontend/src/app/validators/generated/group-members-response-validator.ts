import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {GroupMembersDtoValidator} from './group-members-dto-validator';
import {GroupMembersSearchCriteriaSummaryValidator} from './group-members-search-criteria-summary-validator';

/**
 * GroupMembersResponse Validator
 * Auto-generated from OpenAPI schema
 * Group members search response with results and metadata
 */
export class GroupMembersResponseValidator {
  /**
   * Validates GroupMembersResponse object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {groupMembersResponse: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('members') || value['members'] === null || value['members'] === undefined || value['members'] === '') {
      errors['members'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    // Validation for members
    if (value.hasOwnProperty('members') && value.members) {
      // Validate array items
      if (Array.isArray(value['members'])) {
        value['members'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = GroupMembersDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`members[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    // Validation for searchCriteria
    if (value.hasOwnProperty('searchCriteria') && value.searchCriteria) {
      // Validate nested DTO
      const searchCriteriaControl = {value: value['searchCriteria']} as AbstractControl;
      const searchCriteriaErrors = GroupMembersSearchCriteriaSummaryValidator.validate(searchCriteriaControl);
      if (searchCriteriaErrors) {
        errors['searchCriteria'] = searchCriteriaErrors;
      }
    }

    return Object.keys(errors).length > 0 ? {groupMembersResponse: errors} : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return GroupMembersResponseValidator.validate;
  }
}
