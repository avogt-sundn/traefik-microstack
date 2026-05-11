import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * BankDetailsDto Validator
 * Auto-generated from OpenAPI schema
 * Detailed banking information including IBAN, SWIFT, mandate details, etc.
 */
export class BankDetailsDtoValidator {
  /**
   * Validates BankDetailsDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {bankDetailsDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('iban') || value['iban'] === null || value['iban'] === undefined || value['iban'] === '') {
      errors['iban'] = {key: 'forms.validation.dto.fieldRequired'};
    }
    if (!value.hasOwnProperty('sequenceNumber') || value['sequenceNumber'] === null || value['sequenceNumber'] === undefined || value['sequenceNumber'] === '') {
      errors['sequenceNumber'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    // Validation for sequenceNumber
    if (value.hasOwnProperty('sequenceNumber') && value.sequenceNumber) {
      if (typeof value['sequenceNumber'] === 'number' && value['sequenceNumber'] > 99) {
        errors['sequenceNumber'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 99}};
      }
    }

    // Validation for bankKey
    if (value.hasOwnProperty('bankKey') && value.bankKey) {
      if (typeof value['bankKey'] === 'string' && value['bankKey'].length > 15) {
        errors['bankKey'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 15}};
      }
    }

    // Validation for countryId
    if (value.hasOwnProperty('countryId') && value.countryId) {
      if (typeof value['countryId'] === 'number' && value['countryId'] > 999999) {
        errors['countryId'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 999999}};
      }
    }

    // Validation for accountHolder
    if (value.hasOwnProperty('accountHolder') && value.accountHolder) {
      if (typeof value['accountHolder'] === 'string' && value['accountHolder'].length > 35) {
        errors['accountHolder'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
    }

    // Validation for street
    if (value.hasOwnProperty('street') && value.street) {
      if (typeof value['street'] === 'string' && value['street'].length > 35) {
        errors['street'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
    }

    // Validation for postalCode
    if (value.hasOwnProperty('postalCode') && value.postalCode) {
      if (typeof value['postalCode'] === 'string' && value['postalCode'].length > 10) {
        errors['postalCode'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 10}};
      }
    }

    // Validation for city
    if (value.hasOwnProperty('city') && value.city) {
      if (typeof value['city'] === 'string' && value['city'].length > 35) {
        errors['city'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
    }

    // Validation for swiftCode
    if (value.hasOwnProperty('swiftCode') && value.swiftCode) {
      if (typeof value['swiftCode'] === 'string' && value['swiftCode'].length > 11) {
        errors['swiftCode'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 11}};
      }
    }

    // Validation for modifierId
    if (value.hasOwnProperty('modifierId') && value.modifierId) {
      if (typeof value['modifierId'] === 'string' && value['modifierId'].length > 8) {
        errors['modifierId'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 8}};
      }
    }

    // Validation for lastStopFrom
    if (value.hasOwnProperty('lastStopFrom') && value.lastStopFrom) {
      if (typeof value['lastStopFrom'] === 'string' && value['lastStopFrom'].length > 10) {
        errors['lastStopFrom'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 10}};
      }
    }

    // Validation for lastStopTo
    if (value.hasOwnProperty('lastStopTo') && value.lastStopTo) {
      if (typeof value['lastStopTo'] === 'string' && value['lastStopTo'].length > 10) {
        errors['lastStopTo'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 10}};
      }
    }

    // Validation for reminderFeeFlag
    if (value.hasOwnProperty('reminderFeeFlag') && value.reminderFeeFlag) {
      if (typeof value['reminderFeeFlag'] === 'string' && value['reminderFeeFlag'].length > 2) {
        errors['reminderFeeFlag'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 2}};
      }
    }

    // Validation for arrearsFlag
    if (value.hasOwnProperty('arrearsFlag') && value.arrearsFlag) {
      if (typeof value['arrearsFlag'] === 'string' && value['arrearsFlag'].length > 3) {
        errors['arrearsFlag'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 3}};
      }
    }

    // Validation for iban
    if (value.hasOwnProperty('iban') && value.iban) {
      if (typeof value['iban'] === 'string' && value['iban'].length > 34) {
        errors['iban'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 34}};
      }
    }

    // Validation for mandateReference
    if (value.hasOwnProperty('mandateReference') && value.mandateReference) {
      if (typeof value['mandateReference'] === 'string' && value['mandateReference'].length > 24) {
        errors['mandateReference'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 24}};
      }
      if (typeof value['mandateReference'] === 'string' && !/^EKF-[0-9]{7}-[0-9]{12}$/.test(value['mandateReference'])) {
        errors['mandateReference'] = {key: 'forms.validation.dto.stringPattern'};
      }
    }

    return Object.keys(errors).length > 0 ? { bankDetailsDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return BankDetailsDtoValidator.validate;
  }
}
