import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {AddressTypeDtoValidator} from './address-type-dto-validator';
import {TelecommunicationDtoValidator} from './telecommunication-dto-validator';

/**
 * AddressDto Validator
 * Auto-generated from OpenAPI schema
 * Address information containing location details and related telecommunications
 */
export class AddressDtoValidator {
  /**
   * Validates AddressDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {addressDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('city') || value['city'] === null || value['city'] === undefined || value['city'] === '') {
      errors['city'] = {key: 'forms.validation.dto.fieldRequired'};
    }
    if (!value.hasOwnProperty('houseNumber') || value['houseNumber'] === null || value['houseNumber'] === undefined || value['houseNumber'] === '') {
      errors['houseNumber'] = {key: 'forms.validation.dto.fieldRequired'};
    }
    if (!value.hasOwnProperty('postalCode') || value['postalCode'] === null || value['postalCode'] === undefined || value['postalCode'] === '') {
      errors['postalCode'] = {key: 'forms.validation.dto.fieldRequired'};
    }
    if (!value.hasOwnProperty('street') || value['street'] === null || value['street'] === undefined || value['street'] === '') {
      errors['street'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    // Validation for addressTypeId
    if (value.hasOwnProperty('addressTypeId') && value.addressTypeId) {
      if (typeof value['addressTypeId'] === 'number' && value['addressTypeId'] > 999999) {
        errors['addressTypeId'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 999999}};
      }
    }

    // Validation for postalCode
    if (value.hasOwnProperty('postalCode') && value.postalCode) {
      if (typeof value['postalCode'] === 'string' && value['postalCode'].length < 5) {
        errors['postalCode'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 5}};
      }
      if (typeof value['postalCode'] === 'string' && value['postalCode'].length > 5) {
        errors['postalCode'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 5}};
      }
      if (typeof value['postalCode'] === 'string' && !/^[0-9]+$/.test(value['postalCode'])) {
        errors['postalCode'] = {key: 'forms.validation.dto.stringPattern'};
      }
    }

    // Validation for poBox
    if (value.hasOwnProperty('poBox') && value.poBox) {
      if (typeof value['poBox'] === 'string' && value['poBox'].length < 1) {
        errors['poBox'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 1}};
      }
      if (typeof value['poBox'] === 'string' && value['poBox'].length > 35) {
        errors['poBox'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
    }

    // Validation for street
    if (value.hasOwnProperty('street') && value.street) {
      if (typeof value['street'] === 'string' && value['street'].length < 3) {
        errors['street'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 3}};
      }
      if (typeof value['street'] === 'string' && value['street'].length > 35) {
        errors['street'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
      if (typeof value['street'] === 'string' && !/^[A-Za-zÄÖÜäöüß0-9\s.\-]+$/.test(value['street'])) {
        errors['street'] = {key: 'forms.validation.dto.stringPattern'};
      }
    }

    // Validation for houseNumber
    if (value.hasOwnProperty('houseNumber') && value.houseNumber) {
      if (typeof value['houseNumber'] === 'string' && value['houseNumber'].length < 1) {
        errors['houseNumber'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 1}};
      }
      if (typeof value['houseNumber'] === 'string' && value['houseNumber'].length > 12) {
        errors['houseNumber'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 12}};
      }
      if (typeof value['houseNumber'] === 'string' && !/^[A-Za-z0-9]+$/.test(value['houseNumber'])) {
        errors['houseNumber'] = {key: 'forms.validation.dto.stringPattern'};
      }
    }

    // Validation for city
    if (value.hasOwnProperty('city') && value.city) {
      if (typeof value['city'] === 'string' && value['city'].length < 3) {
        errors['city'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 3}};
      }
      if (typeof value['city'] === 'string' && value['city'].length > 35) {
        errors['city'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
      if (typeof value['city'] === 'string' && !/^[A-Za-zÄÖÜäöüß0-9\s.\-]+$/.test(value['city'])) {
        errors['city'] = {key: 'forms.validation.dto.stringPattern'};
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

    // Validation for addressType
    if (value.hasOwnProperty('addressType') && value.addressType) {
      // Validate nested DTO
      const addressTypeControl = {value: value['addressType']} as AbstractControl;
      const addressTypeErrors = AddressTypeDtoValidator.validate(addressTypeControl);
      if (addressTypeErrors) {
        errors['addressType'] = addressTypeErrors;
      }
    }

    // Validation for telecommunications
    if (value.hasOwnProperty('telecommunications') && value.telecommunications) {
      // Validate array items
      if (Array.isArray(value['telecommunications'])) {
        value['telecommunications'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = TelecommunicationDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`telecommunications[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    return Object.keys(errors).length > 0 ? { addressDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return AddressDtoValidator.validate;
  }
}
