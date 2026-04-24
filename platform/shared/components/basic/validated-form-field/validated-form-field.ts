/* eslint-disable max-lines */
// TODO: fix file size with signal forms refactoring [FIT-307]
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidatorFn,
} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {debounceTime, distinctUntilChanged} from 'rxjs';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {TranslocoModule, TranslocoService} from '@jsverse/transloco';
import {
  DtoValidationError,
  ValidationErrorService,
  ValidationErrorType,
} from '../../../services/validation-error.service';
import {DtoValidator, FormFieldValidationService} from '../../../services/form-field-validation.service';
import {CypressIdDirective} from '../../../directives/cypress-id';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'shared-validated-form-field',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    TranslocoModule,
    ReactiveFormsModule,
    CypressIdDirective,
  ],
  templateUrl: './validated-form-field.html',
  styleUrl: './validated-form-field.scss',
  host: {
    'class': 'shared-validated-form-field',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ValidatedFormField,
      multi: true,
    },
  ],
})
export class ValidatedFormField implements ControlValueAccessor, OnInit {
  internalControl = new FormControl('');

  readonly labelKey = input.required<string>();
  readonly fieldType = input<'input' | 'select'>('input');
  readonly inputType = input<string>('text');
  readonly cssClass = input<string>('search-form-field');
  readonly placeholder = input<string>('');
  readonly showClearButton = input<boolean>(true);
  readonly readonly = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly errorType = input<ValidationErrorType | null>(null);
  readonly allowWildcard = input<boolean>(false);
  readonly customErrorMessages = input<Record<string, string>>({});
  readonly validators = input<ValidatorFn[]>([]);
  readonly asyncValidators = input<AsyncValidatorFn[]>([]);

  readonly dtoValidator = input<DtoValidator | null>(null);
  readonly dtoField = input<string | null>(null);

  readonly options = input<SelectOption[]>([]);
  readonly emptyOptionKey = input<string>('');
  readonly allowEmpty = input<boolean>(true);

  readonly cleared = output<void>();

  protected readonly hasError = signal(false);

  private readonly validationErrorService = inject(ValidationErrorService);
  private readonly formFieldValidationService = inject(FormFieldValidationService);
  private readonly translocoService = inject(TranslocoService);

  private readonly debouncedValue = toSignal(
    this.internalControl.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(300),
    ),
  );

  private readonly controlStatus = toSignal(this.internalControl.statusChanges);

  constructor() {
    effect(() => {
      this.updateValidators();
      const isDisabled = this.disabled() || this.readonly();
      if (isDisabled) {
        this.internalControl.disable({emitEvent: false});
      } else {
        this.internalControl.enable({emitEvent: false});
      }
    });

    effect(() => {
      this.debouncedValue();
      this.controlStatus();
      this.updateErrorState();
    });
  }

  get control(): AbstractControl {
    return this.internalControl;
  }

  get hasValue(): boolean {
    return !!this.internalControl.value?.toString().trim();
  }

  ngOnInit(): void {
    this.updateErrorState();
  }

  clearField(): void {
    this.writeValue('');
    this.onChange();
    this.cleared.emit();
  }

  //ControlValueAccessor callbacks
  onChange = () => { /* empty */ };
  onTouched = () => { /* empty */ };

  registerOnChange(fn: () => void): void {
    this.onChange = fn;
    this.internalControl.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  writeValue(value: string | null): void {
    const newValue = value ?? '';
    if (newValue === (this.internalControl.value ?? '')) return;
    this.internalControl.setValue(newValue, {emitEvent: false});
    if (newValue === '' || newValue === null || newValue === undefined) {
      this.internalControl.markAsUntouched();
      this.internalControl.markAsPristine();
    } else {
      this.internalControl.markAsTouched();
    }
  }

  getErrorMessage(): string | null {
    const dtoError = this.getDtoValidationError();
    const displayName = this.translocoService.translate(this.labelKey());

    return this.validationErrorService.getFieldErrorWithDtoSupport(
      this.control?.errors,
      displayName,
      dtoError,
      this.errorType(),
      this.allowWildcard(),
      this.customErrorMessages(),
    );
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.internalControl.disable({emitEvent: false});
    } else {
      this.internalControl.enable({emitEvent: false});
    }
  }

  private getDtoValidationError(): string | DtoValidationError | null {
    return this.formFieldValidationService.validateField(
      this.dtoValidator(),
      this.dtoField(),
      this.internalControl.value,
      this.internalControl.touched,
      this.internalControl.dirty,
    );
  }

  private updateErrorState(): void {
    const hasFormControlError = !!(this.control?.errors && (this.control.touched || this.control.dirty));
    const dtoValidationError = this.getDtoValidationError();
    const hasDtoError = !!dtoValidationError;

    this.formFieldValidationService.updateControlErrorState(
      this.internalControl,
      dtoValidationError,
      hasFormControlError,
    );
    this.hasError.set(hasFormControlError || hasDtoError);
  }

  private updateValidators(): void {
    const isEditable = !this.readonly() && !this.disabled();
    if (isEditable) {
      this.internalControl.setValidators(this.validators());
      this.internalControl.setAsyncValidators(this.asyncValidators());
    } else {
      this.internalControl.clearValidators();
      this.internalControl.clearAsyncValidators();
    }
    this.internalControl.updateValueAndValidity();
  }
}
