import {AbstractControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';

export class PartnerValidators {

  static atLeastOneFieldValidator(minLength = 3): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control instanceof FormGroup) {
        const hasValidInput = Object.keys(control.controls).some(fieldName => {
          const fieldValue = control.get(fieldName)?.value || '';
          return typeof fieldValue === 'string' && fieldValue.trim().length >= minLength;
        });

        return hasValidInput ? null : {atLeastOneField: {minLength}};
      }
      return null;
    };
  }
}
