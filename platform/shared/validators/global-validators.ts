import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

//ggf. bei vielen Validatoren mit NameSpace und Verteilung auf mehrere Dateien arbeiten
export class GlobalValidators {
  static decimalValidator(decimals: number, errorKey = "decimal"): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value || (!!value && !isNaN(+value) &&
        value == Number(value).toFixed(decimals))) {
        // check case of 15.000 == 15.00
        const numStr = value + "".replace(",", ".");
        if (!numStr.includes(".")) {
          return null;
        }
        const parts = numStr.split(".");
        if (parts.length == 2 && parts[1].length == decimals) {
          return null;
        }
      }

      return {[errorKey]: true};
    }
  }

  static sumValidator(fcNames: string[], maxSum: number, errorKey = "maxSum"): ValidatorFn {
    return (formControl: AbstractControl): ValidationErrors | null => {
      let sum = 0;
      for (const fcName of fcNames) {
        const fc = formControl.parent?.get(fcName);
        if (!!fc && !fc.disabled) {
          const val = fc ? Number(fc.value) : 0;
          sum += val;
        }
      }
      return sum > maxSum ? {[errorKey]: true} : null;
    }
  }
}
