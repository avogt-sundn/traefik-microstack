/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO FIT-218: fix linting error
import {Injectable} from '@angular/core';
import {FormControl} from '@angular/forms';
import {DtoValidator, DtoValidationError} from '@traefik-microstack/shared';
import {
  AddressDtoValidator,
  BankConnectionDtoValidator,
  BankDetailsDtoValidator,
  ContactPersonDtoValidator,
  GroupAssignmentDtoValidator,
  TelecommunicationDtoValidator,
} from '../validators/generated';

// Assisted by AI
@Injectable({
  providedIn: 'root',
})
export class PartnerFieldValidationService {

  /**
   * Creates a validator function for Address DTO fields
   */
  createAddressValidator(): DtoValidator {
    return this.createDtoValidator(AddressDtoValidator.validate, 'addressDto');
  }

  /**
   * Creates a validator function for Telecommunication DTO fields
   */
  createTelecommunicationValidator(): DtoValidator {
    return this.createDtoValidator(TelecommunicationDtoValidator.validate, 'telecommunicationDto');
  }

  /**
   * Creates a validator function for Contact Person DTO fields
   */
  createContactPersonValidator(): DtoValidator {
    return this.createDtoValidator(ContactPersonDtoValidator.validate, 'contactPersonDto');
  }

  /**
   * Creates a validator function for Bank Connection DTO fields
   */
  createBankConnectionValidator(): DtoValidator {
    return this.createDtoValidator(BankConnectionDtoValidator.validate, 'bankConnectionDto');
  }

  /**
   * Creates a validator function for Bank Details DTO fields
   */
  createBankDetailsValidator(): DtoValidator {
    return this.createDtoValidator(BankDetailsDtoValidator.validate, 'bankDetailsDto');
  }

  /**
   * Creates a validator function for Group Assignment DTO fields
   */
  createGroupAssignmentValidator(): DtoValidator {
    return this.createDtoValidator(GroupAssignmentDtoValidator.validate, 'groupAssignmentDto');
  }

  /**
   * Creates a generic validator function for any DTO
   */
  createDtoValidator(
    validatorFunction: (control: FormControl) => any,
    dtoKey: string,
  ): DtoValidator {
    return (fieldName: string, value: any): string | DtoValidationError | null => {
      // Check for empty required fields first
      if (value === null || value === undefined || value === '') {
        // Create a minimal DTO to test if this field is required
        const testDto: any = {[fieldName]: value};
        const testControl = new FormControl(testDto);
        const validationResult = validatorFunction(testControl);

        // If there's a required error for this field, return it
        if (validationResult?.[dtoKey]?.[fieldName]) {
          return validationResult[dtoKey][fieldName];
        }
      } else {
        // For non-empty values, validate pattern/length constraints
        const testDto: any = {[fieldName]: value};
        const testControl = new FormControl(testDto);
        const validationResult = validatorFunction(testControl);

        if (validationResult?.[dtoKey]?.[fieldName]) {
          return validationResult[dtoKey][fieldName];
        }
      }
      return null;
    }
  }
}
