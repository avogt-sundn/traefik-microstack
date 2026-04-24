import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * BranchDto Validator
 * Auto-generated from OpenAPI schema
 * Branch office information containing address and contact details
 */
export class BranchDtoValidator {
  /**
   * Validates BranchDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {branchDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('branchNumber') || value['branchNumber'] === null || value['branchNumber'] === undefined || value['branchNumber'] === '') {
      errors['branchNumber'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    return Object.keys(errors).length > 0 ? { branchDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return BranchDtoValidator.validate;
  }
}
