import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {PartnerFunctionDtoValidator} from './partner-function-dto-validator';
import {AddressDtoValidator} from './address-dto-validator';

/**
 * ContactPersonDto Validator
 * Auto-generated from OpenAPI schema
 * Contact person information containing personal and business details
 */
export class ContactPersonDtoValidator {
  /**
   * Validates ContactPersonDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {contactPersonDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('alphaCode') || value['alphaCode'] === null || value['alphaCode'] === undefined || value['alphaCode'] === '') {
      errors['alphaCode'] = {key: 'forms.validation.dto.fieldRequired'};
    }
    if (!value.hasOwnProperty('name1') || value['name1'] === null || value['name1'] === undefined || value['name1'] === '') {
      errors['name1'] = {key: 'forms.validation.dto.fieldRequired'};
    }
    if (!value.hasOwnProperty('partnerFunctionId') || value['partnerFunctionId'] === null || value['partnerFunctionId'] === undefined || value['partnerFunctionId'] === '') {
      errors['partnerFunctionId'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    // Validation for partnerFunctionId
    if (value.hasOwnProperty('partnerFunctionId') && value.partnerFunctionId) {
      if (typeof value['partnerFunctionId'] === 'number' && value['partnerFunctionId'] > 999999) {
        errors['partnerFunctionId'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 999999}};
      }
    }

    // Validation for nameEdp
    if (value.hasOwnProperty('nameEdp') && value.nameEdp) {
      if (typeof value['nameEdp'] === 'string' && value['nameEdp'].length < 1) {
        errors['nameEdp'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 1}};
      }
      if (typeof value['nameEdp'] === 'string' && value['nameEdp'].length > 128) {
        errors['nameEdp'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 128}};
      }
    }

    // Validation for name1
    if (value.hasOwnProperty('name1') && value.name1) {
      if (typeof value['name1'] === 'string' && value['name1'].length < 3) {
        errors['name1'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 3}};
      }
      if (typeof value['name1'] === 'string' && value['name1'].length > 35) {
        errors['name1'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
      // TODO FIT-521: fix alphaCode, firstname and name1
      // if (typeof value['name1'] === 'string' && !/^[A-Za-zÄÖÜäöüß0-9\s.\-+&]+$/.test(value['name1'])) {
      //   errors['name1'] = {key: 'forms.validation.dto.stringPattern'};
      // }
    }

    // Validation for name2
    if (value.hasOwnProperty('name2') && value.name2) {
      if (typeof value['name2'] === 'string' && value['name2'].length < 3) {
        errors['name2'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 3}};
      }
      if (typeof value['name2'] === 'string' && value['name2'].length > 35) {
        errors['name2'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
      if (typeof value['name2'] === 'string' && !/^[A-Za-zÄÖÜäöüß0-9\s.\-+&]+$/.test(value['name2'])) {
        errors['name2'] = {key: 'forms.validation.dto.stringPattern'};
      }
    }

    // Validation for name3
    if (value.hasOwnProperty('name3') && value.name3) {
      if (typeof value['name3'] === 'string' && value['name3'].length < 3) {
        errors['name3'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 3}};
      }
      if (typeof value['name3'] === 'string' && value['name3'].length > 35) {
        errors['name3'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
      if (typeof value['name3'] === 'string' && !/^[A-Za-zÄÖÜäöüß0-9\s.\-+&]+$/.test(value['name3'])) {
        errors['name3'] = {key: 'forms.validation.dto.stringPattern'};
      }
    }

    // Validation for alphaCode
    if (value.hasOwnProperty('alphaCode') && value.alphaCode) {
      // TODO FIT-521: fix alphaCode, firstname and name1
      // if (typeof value['alphaCode'] === 'string' && value['alphaCode'].length < 3) {
      //   errors['alphaCode'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 3}};
      // }
      if (typeof value['alphaCode'] === 'string' && value['alphaCode'].length > 10) {
        errors['alphaCode'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 10}};
      }
      if (typeof value['alphaCode'] === 'string' && !/^[A-Za-z0-9]+$/.test(value['alphaCode'])) {
        errors['alphaCode'] = {key: 'forms.validation.dto.stringPattern'};
      }
    }

    // Validation for departmentId
    if (value.hasOwnProperty('departmentId') && value.departmentId) {
      if (typeof value['departmentId'] === 'number' && value['departmentId'] > 999999) {
        errors['departmentId'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 999999}};
      }
    }

    // Validation for departmentName
    if (value.hasOwnProperty('departmentName') && value.departmentName) {
      if (typeof value['departmentName'] === 'string' && value['departmentName'].length < 1) {
        errors['departmentName'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 1}};
      }
      if (typeof value['departmentName'] === 'string' && value['departmentName'].length > 35) {
        errors['departmentName'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
    }

    // Validation for hobbyId
    if (value.hasOwnProperty('hobbyId') && value.hobbyId) {
      if (typeof value['hobbyId'] === 'number' && value['hobbyId'] > 999999) {
        errors['hobbyId'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 999999}};
      }
    }

    // Validation for originType
    if (value.hasOwnProperty('originType') && value.originType) {
      if (typeof value['originType'] === 'string' && value['originType'].length > 1) {
        errors['originType'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 1}};
      }
    }

    // Validation for originNumber
    if (value.hasOwnProperty('originNumber') && value.originNumber) {
      if (typeof value['originNumber'] === 'number' && value['originNumber'] > 9999999999) {
        errors['originNumber'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 9999999999}};
      }
    }

    // Validation for gender
    if (value.hasOwnProperty('gender') && value.gender) {
      if (typeof value['gender'] === 'number' && value['gender'] > 9) {
        errors['gender'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 9}};
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

    // Validation for salutationCode
    if (value.hasOwnProperty('salutationCode') && value.salutationCode) {
      if (typeof value['salutationCode'] === 'number' && value['salutationCode'] > 99) {
        errors['salutationCode'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 99}};
      }
    }

    // Validation for letterSalutation
    if (value.hasOwnProperty('letterSalutation') && value.letterSalutation) {
      if (typeof value['letterSalutation'] === 'string' && value['letterSalutation'].length < 1) {
        errors['letterSalutation'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 1}};
      }
      if (typeof value['letterSalutation'] === 'string' && value['letterSalutation'].length > 60) {
        errors['letterSalutation'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 60}};
      }
    }

    // Validation for title
    if (value.hasOwnProperty('title') && value.title) {
      if (typeof value['title'] === 'string' && value['title'].length < 1) {
        errors['title'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 1}};
      }
      if (typeof value['title'] === 'string' && value['title'].length > 35) {
        errors['title'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
    }

    // Validation for firstName
    if (value.hasOwnProperty('firstName') && value.firstName) {
      if (typeof value['firstName'] === 'string' && value['firstName'].length < 1) {
        errors['firstName'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 1}};
      }
      if (typeof value['firstName'] === 'string' && value['firstName'].length > 35) {
        errors['firstName'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
      // TODO FIT-521: fix alphaCode, firstname and name1
      // if (typeof value['firstName'] === 'string' && !/^[A-Za-zÄÖÜäöüßÉÈÊËéèêëÀÁÂÃÅÆÇÎÏÌÍÔÖØÙÚÛÜÝŸÑñ' -]*$/.test(value['firstName'])) {
      //   errors['firstName'] = {key: 'forms.validation.dto.stringPattern'};
      // }
    }

    // Validation for identificationLine
    if (value.hasOwnProperty('identificationLine') && value.identificationLine) {
      if (typeof value['identificationLine'] === 'string' && value['identificationLine'].length < 1) {
        errors['identificationLine'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 1}};
      }
      if (typeof value['identificationLine'] === 'string' && value['identificationLine'].length > 35) {
        errors['identificationLine'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 35}};
      }
    }

    // Validation for dbNumber1
    if (value.hasOwnProperty('dbNumber1') && value.dbNumber1) {
      if (typeof value['dbNumber1'] === 'number' && value['dbNumber1'] > 9999) {
        errors['dbNumber1'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 9999}};
      }
    }

    // Validation for dbNumber2
    if (value.hasOwnProperty('dbNumber2') && value.dbNumber2) {
      if (typeof value['dbNumber2'] === 'number' && value['dbNumber2'] > 9999) {
        errors['dbNumber2'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 9999}};
      }
    }

    // Validation for dbNumber3
    if (value.hasOwnProperty('dbNumber3') && value.dbNumber3) {
      if (typeof value['dbNumber3'] === 'number' && value['dbNumber3'] > 9999) {
        errors['dbNumber3'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 9999}};
      }
    }

    // Validation for wsReason
    if (value.hasOwnProperty('wsReason') && value.wsReason) {
      if (typeof value['wsReason'] === 'string' && value['wsReason'].length < 1) {
        errors['wsReason'] = {key: 'forms.validation.dto.stringMinLength', params: {minLength: 1}};
      }
      if (typeof value['wsReason'] === 'string' && value['wsReason'].length > 40) {
        errors['wsReason'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 40}};
      }
    }

    // Validation for partnerFunction
    if (value.hasOwnProperty('partnerFunction') && value.partnerFunction) {
      // Validate nested DTO
      const partnerFunctionControl = {value: value['partnerFunction']} as AbstractControl;
      const partnerFunctionErrors = PartnerFunctionDtoValidator.validate(partnerFunctionControl);
      if (partnerFunctionErrors) {
        errors['partnerFunction'] = partnerFunctionErrors;
      }
    }

    // Validation for addresses
    if (value.hasOwnProperty('addresses') && value.addresses) {
      // Validate array items
      if (Array.isArray(value['addresses'])) {
        value['addresses'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = AddressDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`addresses[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    return Object.keys(errors).length > 0 ? { contactPersonDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return ContactPersonDtoValidator.validate;
  }
}
