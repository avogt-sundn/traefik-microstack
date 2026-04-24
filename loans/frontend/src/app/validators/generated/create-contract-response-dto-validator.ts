import {ValidatorFn, AbstractControl, ValidationErrors} from '@angular/forms';
import {ContractDtoValidator} from './contract-dto-validator';

/**
 * CreateContractResponseDto Validator
 * Auto-generated from OpenAPI schema
 * Create contract response wrapper
 */
export class CreateContractResponseDtoValidator {
  /**
   * Validates CreateContractResponseDto object
   */
  static validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value || typeof control.value !== 'object') {
      return { createContractResponseDto: { key: 'forms.validation.dto.objectRequired' } };
    }

    const value = control.value;
    const errors: ValidationErrors = {};

    // Validation for contract
    if (value.hasOwnProperty('contract') && value.contract) {
      // Validate nested DTO
      const contractControl = {value: value['contract']} as AbstractControl;
      const contractErrors = ContractDtoValidator.validate(contractControl);
      if (contractErrors) {
        errors['contract'] = contractErrors;
      }
    }

    return Object.keys(errors).length > 0 ? { createContractResponseDto: errors } : null;
  }

  /**
   * Returns the validator function for use in Angular forms
   */
  static getValidator(): ValidatorFn {
    return CreateContractResponseDtoValidator.validate;
  }
}
