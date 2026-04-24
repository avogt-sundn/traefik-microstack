import {Injectable} from '@angular/core';
import {FormControl} from '@angular/forms';
import {DtoValidationError} from './validation-error.service';

export type DtoValidator = (fieldName: string, value: string | null) => string | DtoValidationError | null;

// Assisted by AI
@Injectable({
  providedIn: 'root',
})
export class FormFieldValidationService {

  /**
   * Executes DTO validation for a field if validator and field name are provided
   */
  validateField(
    validator: DtoValidator | null,
    fieldName: string | null,
    value: string | null,
    isTouched: boolean,
    isDirty: boolean,
  ): string | DtoValidationError | null {
    if (!validator || !fieldName) return null;

    // Validate if field has value or was interacted with
    const shouldValidate = value || isTouched || isDirty;
    return shouldValidate ? validator(fieldName, value) : null;
  }

  /**
   * Manages FormControl error state for DTO validation
   */
  updateControlErrorState(
    control: FormControl,
    dtoValidationError: string | DtoValidationError | null,
    hasFormControlError: boolean,
  ): void {
    const hasDtoError = !!dtoValidationError;

    if (hasDtoError && !hasFormControlError) {
      // Set DTO validation error on FormControl (required for mat-error)
      control.setErrors({ dtoValidationError: dtoValidationError });
    } else if (!hasFormControlError && !hasDtoError) {
      // Clear DTO validation errors if no longer relevant
      if (control.errors?.['dtoValidationError']) {
        const otherErrors = Object.fromEntries(
          Object.entries(control.errors).filter(([key]) => key !== 'dtoValidationError'),
        );
        const hasOtherErrors = Object.keys(otherErrors).length > 0;
        control.setErrors(hasOtherErrors ? otherErrors : null);
      }
    }
  }
}
