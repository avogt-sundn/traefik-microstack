import {ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';
import {AssetDtoValidator} from './asset-dto-validator';

/**
 * ContractDto Validator
 * Auto-generated from OpenAPI schema
 * Contract data
 */
export class ContractDtoValidator {
  /**
   * Validates ContractDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return { contractDto: { key: 'forms.validation.dto.objectRequired' } };
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    // Validation for duration
    if (value.hasOwnProperty('duration') && value.duration) {
      if (typeof value['duration'] === 'string' && !/^\d+-\d+$/.test(value['duration'])) {
        errors['duration'] = { key: 'forms.validation.dto.stringPattern' };
      }
    }

    // Validation for assets
    if (value.hasOwnProperty('assets') && value.assets) {
      // Validate array items
      if (Array.isArray(value['assets'])) {
        value['assets'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = AssetDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`assets[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    return Object.keys(errors).length > 0 ? { contractDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return ContractDtoValidator.validate;
  }
}
