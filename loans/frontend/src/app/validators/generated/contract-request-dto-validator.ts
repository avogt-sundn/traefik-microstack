import {ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';
import {AssetRequestDtoValidator} from './asset-request-dto-validator';

/**
 * ContractRequestDto Validator
 * Auto-generated from OpenAPI schema
 * Contract creation request with asset support
 */
export class ContractRequestDtoValidator {
  /**
   * Validates ContractRequestDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return { contractRequestDto: { key: 'forms.validation.dto.objectRequired' } };
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('branding') || value['branding'] === null || value['branding'] === undefined || value['branding'] === '') {
      errors['branding'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('businessChannel') || value['businessChannel'] === null || value['businessChannel'] === undefined || value['businessChannel'] === '') {
      errors['businessChannel'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('businessType') || value['businessType'] === null || value['businessType'] === undefined || value['businessType'] === '') {
      errors['businessType'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('client') || value['client'] === null || value['client'] === undefined || value['client'] === '') {
      errors['client'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('code') || value['code'] === null || value['code'] === undefined || value['code'] === '') {
      errors['code'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('currency') || value['currency'] === null || value['currency'] === undefined || value['currency'] === '') {
      errors['currency'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('department') || value['department'] === null || value['department'] === undefined || value['department'] === '') {
      errors['department'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('distributionChannel') || value['distributionChannel'] === null || value['distributionChannel'] === undefined || value['distributionChannel'] === '') {
      errors['distributionChannel'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('financingType') || value['financingType'] === null || value['financingType'] === undefined || value['financingType'] === '') {
      errors['financingType'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('name') || value['name'] === null || value['name'] === undefined || value['name'] === '') {
      errors['name'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('product') || value['product'] === null || value['product'] === undefined || value['product'] === '') {
      errors['product'] = { key: 'forms.validation.dto.fieldRequired' };
    }
    if (!value.hasOwnProperty('rateType') || value['rateType'] === null || value['rateType'] === undefined || value['rateType'] === '') {
      errors['rateType'] = { key: 'forms.validation.dto.fieldRequired' };
    }

    // Validation for client
    if (value.hasOwnProperty('client') && value.client) {
      if (typeof value['client'] === 'string' && value['client'].length > 10) {
        errors['client'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 10 } };
      }
    }

    // Validation for code
    if (value.hasOwnProperty('code') && value.code) {
      if (typeof value['code'] === 'string' && value['code'].length > 15) {
        errors['code'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 15 } };
      }
    }

    // Validation for name
    if (value.hasOwnProperty('name') && value.name) {
      if (typeof value['name'] === 'string' && value['name'].length > 50) {
        errors['name'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 50 } };
      }
    }

    // Validation for duration
    if (value.hasOwnProperty('duration') && value.duration) {
      if (typeof value['duration'] === 'string' && !/^\d+-\d+$/.test(value['duration'])) {
        errors['duration'] = { key: 'forms.validation.dto.stringPattern' };
      }
    }

    // Validation for branding
    if (value.hasOwnProperty('branding') && value.branding) {
      if (typeof value['branding'] === 'string' && value['branding'].length > 15) {
        errors['branding'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 15 } };
      }
    }

    // Validation for businessChannel
    if (value.hasOwnProperty('businessChannel') && value.businessChannel) {
      if (typeof value['businessChannel'] === 'string' && value['businessChannel'].length > 15) {
        errors['businessChannel'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 15 } };
      }
    }

    // Validation for businessType
    if (value.hasOwnProperty('businessType') && value.businessType) {
      if (typeof value['businessType'] === 'string' && value['businessType'].length > 15) {
        errors['businessType'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 15 } };
      }
    }

    // Validation for currency
    if (value.hasOwnProperty('currency') && value.currency) {
      if (typeof value['currency'] === 'string' && value['currency'].length > 15) {
        errors['currency'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 15 } };
      }
    }

    // Validation for department
    if (value.hasOwnProperty('department') && value.department) {
      if (typeof value['department'] === 'string' && value['department'].length > 15) {
        errors['department'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 15 } };
      }
    }

    // Validation for distributionChannel
    if (value.hasOwnProperty('distributionChannel') && value.distributionChannel) {
      if (typeof value['distributionChannel'] === 'string' && value['distributionChannel'].length > 15) {
        errors['distributionChannel'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 15 } };
      }
    }

    // Validation for financingType
    if (value.hasOwnProperty('financingType') && value.financingType) {
      if (typeof value['financingType'] === 'string' && value['financingType'].length > 15) {
        errors['financingType'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 15 } };
      }
    }

    // Validation for product
    if (value.hasOwnProperty('product') && value.product) {
      if (typeof value['product'] === 'string' && value['product'].length > 15) {
        errors['product'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 15 } };
      }
    }

    // Validation for rateType
    if (value.hasOwnProperty('rateType') && value.rateType) {
      if (typeof value['rateType'] === 'string' && value['rateType'].length > 15) {
        errors['rateType'] = { key: 'forms.validation.dto.stringMaxLength', params: { maxLength: 15 } };
      }
    }

    // Validation for assets
    if (value.hasOwnProperty('assets') && value.assets) {
      // Validate array items
      if (Array.isArray(value['assets'])) {
        value['assets'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = AssetRequestDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`assets[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    return Object.keys(errors).length > 0 ? { contractRequestDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return ContractRequestDtoValidator.validate;
  }
}
