import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {BranchDtoValidator} from './branch-dto-validator';
import {SalesAreaFocusDtoValidator} from './sales-area-focus-dto-validator';

/**
 * SalesAreaDataResponse Validator
 * Auto-generated from OpenAPI schema
 * Sales area data response containing branch offices and sales area focus information
 */
export class SalesAreaDataResponseValidator {
  /**
   * Validates SalesAreaDataResponse object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {salesAreaDataResponse: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('branches') || value['branches'] === null || value['branches'] === undefined || value['branches'] === '') {
      errors['branches'] = {key: 'forms.validation.dto.fieldRequired'};
    }
    if (!value.hasOwnProperty('salesAreaFocus') || value['salesAreaFocus'] === null || value['salesAreaFocus'] === undefined || value['salesAreaFocus'] === '') {
      errors['salesAreaFocus'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    // Validation for branches
    if (value.hasOwnProperty('branches') && value.branches) {
      // Validate array items
      if (Array.isArray(value['branches'])) {
        value['branches'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = BranchDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`branches[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    // Validation for salesAreaFocus
    if (value.hasOwnProperty('salesAreaFocus') && value.salesAreaFocus) {
      // Validate array items
      if (Array.isArray(value['salesAreaFocus'])) {
        value['salesAreaFocus'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = SalesAreaFocusDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`salesAreaFocus[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    return Object.keys(errors).length > 0 ? { salesAreaDataResponse: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return SalesAreaDataResponseValidator.validate;
  }
}
