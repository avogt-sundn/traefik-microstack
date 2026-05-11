import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {CommunicationTypeDtoValidator} from './communication-type-dto-validator';

/**
 * TelecommunicationDto Validator
 * Auto-generated from OpenAPI schema
 * Telecommunication information including phone numbers and email addresses
 */
export class TelecommunicationDtoValidator {
  /**
   * Validates TelecommunicationDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {telecommunicationDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    // Validation for telecommunicationType
    if (value.hasOwnProperty('telecommunicationType') && value.telecommunicationType) {
      if (typeof value['telecommunicationType'] === 'number' && value['telecommunicationType'] > 999999) {
        errors['telecommunicationType'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 999999}};
      }
    }

    // Validation for countryCode
    if (value.hasOwnProperty('countryCode') && value.countryCode) {
      if (typeof value['countryCode'] === 'string' && value['countryCode'].length < 2) {
        errors['countryCode'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 2}};
      }
      if (typeof value['countryCode'] === 'string' && value['countryCode'].length > 6) {
        errors['countryCode'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 6}};
      }
      if (typeof value['countryCode'] === 'string' && !/^[0-9]+$/.test(value['countryCode'])) {
        errors['countryCode'] = {key: 'forms.validation.dto.stringPattern'};
      }
    }

    // Validation for areaCode
    if (value.hasOwnProperty('areaCode') && value.areaCode) {
      if (typeof value['areaCode'] === 'string' && value['areaCode'].length < 2) {
        errors['areaCode'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 2}};
      }
      if (typeof value['areaCode'] === 'string' && value['areaCode'].length > 6) {
        errors['areaCode'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 6}};
      }
      if (typeof value['areaCode'] === 'string' && !/^[0-9]+$/.test(value['areaCode'])) {
        errors['areaCode'] = {key: 'forms.validation.dto.stringPattern'};
      }
    }

    // Validation for phoneNumber
    if (value.hasOwnProperty('phoneNumber') && value.phoneNumber) {
      if (typeof value['phoneNumber'] === 'string' && value['phoneNumber'].length < 6) {
        errors['phoneNumber'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 6}};
      }
      if (typeof value['phoneNumber'] === 'string' && value['phoneNumber'].length > 15) {
        errors['phoneNumber'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 15}};
      }
      if (typeof value['phoneNumber'] === 'string' && !/^[0-9]+$/.test(value['phoneNumber'])) {
        errors['phoneNumber'] = {key: 'forms.validation.dto.stringPattern'};
      }
    }

    // Validation for email
    if (value.hasOwnProperty('email') && value.email) {
      if (typeof value['email'] === 'string' && value['email'].length < 3) {
        errors['email'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 3}};
      }
      if (typeof value['email'] === 'string' && value['email'].length > 256) {
        errors['email'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 256}};
      }
      if (typeof value['email'] === 'string' && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value['email'])) {
        errors['email'] = {key: 'forms.validation.dto.stringPattern'};
      }
    }

    // Validation for modifierId
    if (value.hasOwnProperty('modifierId') && value.modifierId) {
      if (typeof value['modifierId'] === 'string' && value['modifierId'].length < 1) {
        errors['modifierId'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 1}};
      }
      if (typeof value['modifierId'] === 'string' && value['modifierId'].length > 8) {
        errors['modifierId'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 8}};
      }
    }

    // Validation for communicationType
    if (value.hasOwnProperty('communicationType') && value.communicationType) {
      // Validate nested DTO
      const communicationTypeControl = {value: value['communicationType']} as AbstractControl;
      const communicationTypeErrors = CommunicationTypeDtoValidator.validate(communicationTypeControl);
      if (communicationTypeErrors) {
        errors['communicationType'] = communicationTypeErrors;
      }
    }

    return Object.keys(errors).length > 0 ? { telecommunicationDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return TelecommunicationDtoValidator.validate;
  }
}
