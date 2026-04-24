//TODO + TODO Unit Test
import {Directive} from '@angular/core';

@Directive({
  standalone: true,
  selector: `
    input[matInput],
    mat-checkbox,
    mat-datepicker,
    mat-select,
    mat-radio-group,
    mat-chip-list
  `,
})
export class ErrorMessage {
  // private readonly errorCallbackService = inject(ErrorCallbackService);
  //
  // constructor(
  //   @Host() @Self() @Optional()  matInput: MatInput,
  //   @Host() @Self() @Optional()  matCheckbox: MatCheckbox,
  //   @Host() @Self() @Optional()  matDatepicker: MatDatepicker,
  //   @Host() @Self() @Optional()  matSelect: MatSelect,
  //   @Host() @Self() @Optional()  matRadioGroup: MatRadioGroup,
  //   @Host() @Self() @Optional()  matAutocomplete: MatAutocomplete,
  // ) {
  //   const component =
  //     matInput ||
  //     matCheckbox ||
  //     matDatepicker ||
  //     matSelect ||
  //     matRadioGroup ||
  //     matAutocomplete;

  // component.errorCallback = this.errorCallbackService.errorCallback;
  // }
}
