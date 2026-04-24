import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {GroupDtoValidator} from './group-dto-validator';

/**
 * GroupListResponse Validator
 * Auto-generated from OpenAPI schema
 * Group list response containing all partner groups/associations
 */
export class GroupListResponseValidator {
  /**
   * Validates GroupListResponse object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {groupListResponse: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('groups') || value['groups'] === null || value['groups'] === undefined || value['groups'] === '') {
      errors['groups'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    // Validation for groups
    if (value.hasOwnProperty('groups') && value.groups) {
      // Validate array items
      if (Array.isArray(value['groups'])) {
        value['groups'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = GroupDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`groups[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    return Object.keys(errors).length > 0 ? { groupListResponse: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return GroupListResponseValidator.validate;
  }
}
