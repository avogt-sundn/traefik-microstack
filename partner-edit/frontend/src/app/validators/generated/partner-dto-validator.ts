import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {ContactPersonDtoValidator} from './contact-person-dto-validator';
import {GroupAssignmentDtoValidator} from './group-assignment-dto-validator';
import {BankConnectionDtoValidator} from './bank-connection-dto-validator';

/**
 * PartnerDto Validator
 * Auto-generated from OpenAPI schema
 * Partner information containing comprehensive business details and related entities
 */
export class PartnerDtoValidator {
  /**
   * Validates PartnerDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {partnerDto: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    // Validation for businessGroupId
    if (value.hasOwnProperty('businessGroupId') && value.businessGroupId) {
      if (typeof value['businessGroupId'] === 'number' && value['businessGroupId'] > 99999999) {
        errors['businessGroupId'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 99999999}};
      }
    }

    // Validation for mainIndustry
    if (value.hasOwnProperty('mainIndustry') && value.mainIndustry) {
      if (typeof value['mainIndustry'] === 'number' && value['mainIndustry'] > 9999999) {
        errors['mainIndustry'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 9999999}};
      }
    }

    // Validation for subIndustry
    if (value.hasOwnProperty('subIndustry') && value.subIndustry) {
      if (typeof value['subIndustry'] === 'number' && value['subIndustry'] > 99) {
        errors['subIndustry'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 99}};
      }
    }

    // Validation for creditRating1
    if (value.hasOwnProperty('creditRating1') && value.creditRating1) {
      if (typeof value['creditRating1'] === 'string' && value['creditRating1'].length > 2) {
        errors['creditRating1'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 2}};
      }
    }

    // Validation for creditRating2
    if (value.hasOwnProperty('creditRating2') && value.creditRating2) {
      if (typeof value['creditRating2'] === 'string' && value['creditRating2'].length > 2) {
        errors['creditRating2'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 2}};
      }
    }

    // Validation for legalForm
    if (value.hasOwnProperty('legalForm') && value.legalForm) {
      if (typeof value['legalForm'] === 'number' && value['legalForm'] > 999999) {
        errors['legalForm'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 999999}};
      }
    }

    // Validation for partnerStatus
    if (value.hasOwnProperty('partnerStatus') && value.partnerStatus) {
      if (typeof value['partnerStatus'] === 'string' && value['partnerStatus'].length > 1) {
        errors['partnerStatus'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 1}};
      }
    }

    // Validation for areaPostalCode
    if (value.hasOwnProperty('areaPostalCode') && value.areaPostalCode) {
      if (typeof value['areaPostalCode'] === 'string' && value['areaPostalCode'].length > 10) {
        errors['areaPostalCode'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 10}};
      }
    }

    // Validation for advisor
    if (value.hasOwnProperty('advisor') && value.advisor) {
      if (typeof value['advisor'] === 'string' && value['advisor'].length > 8) {
        errors['advisor'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 8}};
      }
    }

    // Validation for modifierId
    if (value.hasOwnProperty('modifierId') && value.modifierId) {
      if (typeof value['modifierId'] === 'string' && value['modifierId'].length > 8) {
        errors['modifierId'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 8}};
      }
    }

    // Validation for masterAccounts
    if (value.hasOwnProperty('masterAccounts') && value.masterAccounts) {
      if (typeof value['masterAccounts'] === 'number' && value['masterAccounts'] > 999) {
        errors['masterAccounts'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 999}};
      }
    }

    // Validation for branchNumber
    if (value.hasOwnProperty('branchNumber') && value.branchNumber) {
      if (typeof value['branchNumber'] === 'number' && value['branchNumber'] > 99) {
        errors['branchNumber'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 99}};
      }
    }

    // Validation for syncHost
    if (value.hasOwnProperty('syncHost') && value.syncHost) {
      if (typeof value['syncHost'] === 'string' && value['syncHost'].length > 1) {
        errors['syncHost'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 1}};
      }
    }

    // Validation for branchNumber2
    if (value.hasOwnProperty('branchNumber2') && value.branchNumber2) {
      if (typeof value['branchNumber2'] === 'number' && value['branchNumber2'] > 99) {
        errors['branchNumber2'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 99}};
      }
    }

    // Validation for organizationForm
    if (value.hasOwnProperty('organizationForm') && value.organizationForm) {
      if (typeof value['organizationForm'] === 'string' && value['organizationForm'].length > 1) {
        errors['organizationForm'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 1}};
      }
    }

    // Validation for bmDocuments
    if (value.hasOwnProperty('bmDocuments') && value.bmDocuments) {
      if (typeof value['bmDocuments'] === 'number' && value['bmDocuments'] > 999999) {
        errors['bmDocuments'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 999999}};
      }
    }

    // Validation for bbkNumber
    if (value.hasOwnProperty('bbkNumber') && value.bbkNumber) {
      if (typeof value['bbkNumber'] === 'number' && value['bbkNumber'] > 9999999999) {
        errors['bbkNumber'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 9999999999}};
      }
    }

    // Validation for balanceSheetDate
    if (value.hasOwnProperty('balanceSheetDate') && value.balanceSheetDate) {
      if (typeof value['balanceSheetDate'] === 'string' && value['balanceSheetDate'].length > 10) {
        errors['balanceSheetDate'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 10}};
      }
    }

    // Validation for spmNumber
    if (value.hasOwnProperty('spmNumber') && value.spmNumber) {
      if (typeof value['spmNumber'] === 'string' && value['spmNumber'].length > 8) {
        errors['spmNumber'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 8}};
      }
    }

    // Validation for insolvencyStatus
    if (value.hasOwnProperty('insolvencyStatus') && value.insolvencyStatus) {
      if (typeof value['insolvencyStatus'] === 'number' && value['insolvencyStatus'] > 99999) {
        errors['insolvencyStatus'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 99999}};
      }
    }

    // Validation for insolvencyComment
    if (value.hasOwnProperty('insolvencyComment') && value.insolvencyComment) {
      if (typeof value['insolvencyComment'] === 'string' && value['insolvencyComment'].length > 512) {
        errors['insolvencyComment'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 512}};
      }
    }

    // Validation for sgRating
    if (value.hasOwnProperty('sgRating') && value.sgRating) {
      if (typeof value['sgRating'] === 'string' && value['sgRating'].length > 5) {
        errors['sgRating'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 5}};
      }
    }

    // Validation for ratingVersion
    if (value.hasOwnProperty('ratingVersion') && value.ratingVersion) {
      if (typeof value['ratingVersion'] === 'string' && value['ratingVersion'].length > 8) {
        errors['ratingVersion'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 8}};
      }
    }

    // Validation for ratingUser
    if (value.hasOwnProperty('ratingUser') && value.ratingUser) {
      if (typeof value['ratingUser'] === 'string' && value['ratingUser'].length > 8) {
        errors['ratingUser'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 8}};
      }
    }

    // Validation for ratingReason
    if (value.hasOwnProperty('ratingReason') && value.ratingReason) {
      if (typeof value['ratingReason'] === 'string' && value['ratingReason'].length > 128) {
        errors['ratingReason'] = {key: 'forms.validation.dto.stringMaxLength', params: {maxLength: 128}};
      }
    }

    // Validation for kneBbkNumber
    if (value.hasOwnProperty('kneBbkNumber') && value.kneBbkNumber) {
      if (typeof value['kneBbkNumber'] === 'number' && value['kneBbkNumber'] > 9999999999) {
        errors['kneBbkNumber'] = {key: 'forms.validation.dto.numberMax', params: {maximum: 9999999999}};
      }
    }

    // Validation for contactPersons
    if (value.hasOwnProperty('contactPersons') && value.contactPersons) {
      // Validate array items
      if (Array.isArray(value['contactPersons'])) {
        value['contactPersons'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = ContactPersonDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`contactPersons[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    // Validation for groupAssignments
    if (value.hasOwnProperty('groupAssignments') && value.groupAssignments) {
      // Validate array items
      if (Array.isArray(value['groupAssignments'])) {
        value['groupAssignments'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = GroupAssignmentDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`groupAssignments[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    // Validation for bankConnections
    if (value.hasOwnProperty('bankConnections') && value.bankConnections) {
      // Validate array items
      if (Array.isArray(value['bankConnections'])) {
        value['bankConnections'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = BankConnectionDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`bankConnections[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    return Object.keys(errors).length > 0 ? {partnerDto: errors} : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return PartnerDtoValidator.validate;
  }
}
