import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {PartnerGroupSearchDtoValidator} from './partner-group-search-dto-validator';
import {PartnerGroupSearchCriteriaSummaryValidator} from './partner-group-search-criteria-summary-validator';

/**
 * PartnerGroupSearchResponse Validator
 * Auto-generated from OpenAPI schema
 * Partner group search response with results and metadata
 */
export class PartnerGroupSearchResponseValidator {
  /**
   * Validates PartnerGroupSearchResponse object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return {partnerGroupSearchResponse: {key: 'forms.validation.dto.objectRequired'}};
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    if (!value.hasOwnProperty('partners') || value['partners'] === null || value['partners'] === undefined || value['partners'] === '') {
      errors['partners'] = {key: 'forms.validation.dto.fieldRequired'};
    }

    // Validation for partners
    if (value.hasOwnProperty('partners') && value.partners) {
      // Validate array items
      if (Array.isArray(value['partners'])) {
        value['partners'].forEach((item: any, index: number) => {
          if (item) {
            const itemControl = {value: item} as AbstractControl;
            const itemErrors = PartnerGroupSearchDtoValidator.validate(itemControl);
            if (itemErrors) {
              errors[`partners[${index}]`] = itemErrors;
            }
          }
        });
      }
    }

    // Validation for searchCriteria
    if (value.hasOwnProperty('searchCriteria') && value.searchCriteria) {
      // Validate nested DTO
      const searchCriteriaControl = {value: value['searchCriteria']} as AbstractControl;
      const searchCriteriaErrors = PartnerGroupSearchCriteriaSummaryValidator.validate(searchCriteriaControl);
      if (searchCriteriaErrors) {
        errors['searchCriteria'] = searchCriteriaErrors;
      }
    }

    return Object.keys(errors).length > 0 ? {partnerGroupSearchResponse: errors} : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return PartnerGroupSearchResponseValidator.validate;
  }
}
