import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * GroupDto Validator
 * Auto-generated from OpenAPI schema
 * Partner group/association (Verbund) information
 */
export class GroupDtoValidator {
  /**
   * Validates GroupDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {groupDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};



    return Object.keys(errors).length > 0 ? { groupDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return GroupDtoValidator.validate;
  }
}
