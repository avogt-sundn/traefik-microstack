import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * CommunicationTypeDto Validator
 * Auto-generated from OpenAPI schema
 * Communication type classification information
 */
export class CommunicationTypeDtoValidator {
  /**
   * Validates CommunicationTypeDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {communicationTypeDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('communicationTypeId') || value['communicationTypeId'] === null || value['communicationTypeId'] === undefined || value['communicationTypeId'] === '') {
      errors['communicationTypeId'] = {key: 'forms.validation.dto.fieldRequired'};
    }
    if (!value.hasOwnProperty('tableText') || value['tableText'] === null || value['tableText'] === undefined || value['tableText'] === '') {
      errors['tableText'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    return Object.keys(errors).length > 0 ? { communicationTypeDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return CommunicationTypeDtoValidator.validate;
  }
}
