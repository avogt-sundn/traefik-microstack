import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {BankDetailsDtoValidator} from './bank-details-dto-validator';

/**
 * BankConnectionDto Validator
 * Auto-generated from OpenAPI schema
 * Bank connection information containing basic banking details
 */
export class BankConnectionDtoValidator {
  /**
   * Validates BankConnectionDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {bankConnectionDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('sequenceNumber') || value['sequenceNumber'] === null || value['sequenceNumber'] === undefined || value['sequenceNumber'] === '') {
      errors['sequenceNumber'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    // Validation for sequenceNumber
    if (value.hasOwnProperty('sequenceNumber') && value.sequenceNumber) {
      if (typeof value['sequenceNumber'] === 'number' && value['sequenceNumber'] > 99) {
        errors['sequenceNumber'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 99}};
      }
    }

    // Validation for bankName
    if (value.hasOwnProperty('bankName') && value.bankName) {
      if (typeof value['bankName'] === 'string' && value['bankName'].length > 35) {
        errors['bankName'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
    }

    // Validation for bankCode
    if (value.hasOwnProperty('bankCode') && value.bankCode) {
      if (typeof value['bankCode'] === 'string' && value['bankCode'].length > 16) {
        errors['bankCode'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 16}};
      }
    }

    // Validation for accountNumber
    if (value.hasOwnProperty('accountNumber') && value.accountNumber) {
      if (typeof value['accountNumber'] === 'string' && value['accountNumber'].length > 18) {
        errors['accountNumber'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 18}};
      }
    }

    // Validation for bankDetails
    if (value.hasOwnProperty('bankDetails') && value.bankDetails) {
      // Validate nested DTO
      const bankDetailsControl = {value: value['bankDetails']} as AbstractControl;
      const bankDetailsErrors = BankDetailsDtoValidator.validate(bankDetailsControl);
      if (bankDetailsErrors) {
        errors['bankDetails'] = bankDetailsErrors;
      }
    }

    return Object.keys(errors).length > 0 ? { bankConnectionDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return BankConnectionDtoValidator.validate;
  }
}
