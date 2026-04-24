import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * SalesAreaFocusDto Validator
 * Auto-generated from OpenAPI schema
 * Sales area focus information containing advisor assignments and regional data
 */
export class SalesAreaFocusDtoValidator {
  /**
   * Validates SalesAreaFocusDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {salesAreaFocusDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('areaNumber') || value['areaNumber'] === null || value['areaNumber'] === undefined || value['areaNumber'] === '') {
      errors['areaNumber'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    return Object.keys(errors).length > 0 ? { salesAreaFocusDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return SalesAreaFocusDtoValidator.validate;
  }
}
