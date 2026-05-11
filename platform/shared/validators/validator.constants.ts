import {Validators} from '@angular/forms';
import {GlobalValidators} from './global-validators';

export const name = [Validators.maxLength(120)];

export const requiredPercentValidator = [
  Validators.required,
  GlobalValidators.decimalValidator(2),
  GlobalValidators.sumValidator([
    'input1',
    'imput2',
  ], 100),
];
