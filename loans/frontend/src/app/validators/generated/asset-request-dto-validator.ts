import {ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';
import {VehicleRequestDtoValidator} from './vehicle-request-dto-validator';

/**
 * AssetRequestDto Validator
 * Auto-generated from OpenAPI schema
 * Asset creation request data
 */
export class AssetRequestDtoValidator {
  /**
   * Validates AssetRequestDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return { assetRequestDto: { key: 'forms.validation.dto.objectRequired' } };
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('assetNumber') || value['assetNumber'] === null || value['assetNumber'] === undefined || value['assetNumber'] === '') {
      errors['assetNumber'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('vehicles') || value['vehicles'] === null || value['vehicles'] === undefined || value['vehicles'] === '') {
      errors['vehicles'] = { key: 'forms.validation.dto.fieldRequired' };
    }

    // Validation for vehicles
    if (value.hasOwnProperty('vehicles') && value.vehicles) {
      // Validate array items
      if (Array.isArray(value['vehicles'])) {
        value['vehicles'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = VehicleRequestDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`vehicles[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    return Object.keys(errors).length > 0 ? { assetRequestDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return AssetRequestDtoValidator.validate;
  }
}
