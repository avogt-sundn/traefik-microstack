import {ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';

/**
 * VehicleRequestDto Validator
 * Auto-generated from OpenAPI schema
 * Vehicle creation request data
 */
export class VehicleRequestDtoValidator {
  /**
   * Validates VehicleRequestDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return { vehicleRequestDto: { key: 'forms.validation.dto.objectRequired' } };
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('category') || value['category'] === null || value['category'] === undefined || value['category'] === '') {
      errors['category'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('energy') || value['energy'] === null || value['energy'] === undefined || value['energy'] === '') {
      errors['energy'] = { key: 'forms.validation.dto.fieldRequired' };
    }

    // Validation for vin
    if (value.hasOwnProperty('vin') && value.vin) {
      if (typeof value['vin'] === 'string' && value['vin'].length > 18) {
        errors['vin'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 18 } };
      }
    }

    // Validation for licensePlate
    if (value.hasOwnProperty('licensePlate') && value.licensePlate) {
      if (typeof value['licensePlate'] === 'string' && value['licensePlate'].length > 10) {
        errors['licensePlate'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 10 } };
      }
    }

    return Object.keys(errors).length > 0 ? { vehicleRequestDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return VehicleRequestDtoValidator.validate;
  }
}
