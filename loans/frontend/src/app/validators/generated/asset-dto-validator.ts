import {ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';
import {VehicleDtoValidator} from './vehicle-dto-validator';

/**
 * AssetDto Validator
 * Auto-generated from OpenAPI schema
 * Asset data
 */
export class AssetDtoValidator {
  /**
   * Validates AssetDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return { assetDto: { key: 'forms.validation.dto.objectRequired' } };
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    // Validation for vehicles
    if (value.hasOwnProperty('vehicles') && value.vehicles) {
      // Validate array items
      if (Array.isArray(value['vehicles'])) {
        value['vehicles'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = VehicleDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`vehicles[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    return Object.keys(errors).length > 0 ? { assetDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return AssetDtoValidator.validate;
  }
}
