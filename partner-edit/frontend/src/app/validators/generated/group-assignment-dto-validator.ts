import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * GroupAssignmentDto Validator
 * Auto-generated from OpenAPI schema
 * Group assignment (partner-group assignment) information with assignment details
 */
export class GroupAssignmentDtoValidator {
  /**
   * Validates GroupAssignmentDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {groupAssignmentDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('groupId') || value['groupId'] === null || value['groupId'] === undefined || value['groupId'] === '') {
      errors['groupId'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    // Validation for participation
    if (value.hasOwnProperty('participation') && value.participation) {
      if (typeof value['participation'] === 'number' && value['participation'] < 0) {
        errors['participation'] = {key: 'forms.validation.dto.numberMin', params: {minimum: 0}};
      }
      if (typeof value['participation'] === 'number' && value['participation'] > 100) {
        errors['participation'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 100}};
      }
    }

    return Object.keys(errors).length > 0 ? { groupAssignmentDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return GroupAssignmentDtoValidator.validate;
  }
}
