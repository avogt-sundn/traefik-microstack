import {ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';

/**
 * VehicleDto Validator
 * Auto-generated from OpenAPI schema
 * Vehicle data
 */
export class VehicleDtoValidator {
  /**
   * Validates VehicleDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return { vehicleDto: { key: 'forms.validation.dto.objectRequired' } };
    }

    const value = control.value;
    const errors: ValidationErrors = {};



    return Object.keys(errors).length > 0 ? { vehicleDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return VehicleDtoValidator.validate;
  }
}
