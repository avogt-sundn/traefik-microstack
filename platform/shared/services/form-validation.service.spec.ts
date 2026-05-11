import {TestBed} from '@angular/core/testing';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Mocked} from 'vitest';
import {FormValidationService} from './form-validation.service';
import {ValidationErrorService} from './validation-error.service';


describe('FormValidationService', () => {
  let service: FormValidationService;
  let mockValidationErrorService: Mocked<Partial<ValidationErrorService>>;

  beforeEach(() => {

    mockValidationErrorService = {
      getFieldError: vi.fn(),
    }

    TestBed.configureTestingModule({
      providers: [
        FormValidationService,
        {provide: ValidationErrorService, useValue: mockValidationErrorService},
      ],
    });

    service = TestBed.inject(FormValidationService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateForm', () => {
    it('should return true for valid form', () => {
      // Given
      const form = new FormGroup({
        name: new FormControl('John Doe'),
      });
      const markAllAsTouchedSpy = vi.spyOn(form, 'markAllAsTouched');

      // When
      const result = service.validateForm(form);
      // Then
      expect(result).toBe(true);
      expect(markAllAsTouchedSpy).not.toHaveBeenCalled();
    });

    it('should return false and mark all fields as touched for invalid form', () => {
      // Given
      const nameControl = new FormControl('', Validators.required);
      const form = new FormGroup({
        name: nameControl,
      });
      const markAllAsTouchedSpy = vi.spyOn(form, 'markAllAsTouched');

      // When
      const result = service.validateForm(form);

      // Then
      expect(result).toBe(false);
      expect(markAllAsTouchedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetForm', () => {
    it('should reset form and clear validation states', () => {
      // Given
      const nameControl = new FormControl('John Doe', Validators.required);
      nameControl.markAsTouched();
      nameControl.markAsDirty();

      const form = new FormGroup({
        name: nameControl,
      });

      const resetSpy = vi.spyOn(form, 'reset');
      const markAsUntouchedSpy = vi.spyOn(form, 'markAsUntouched');
      const markAsPristineSpy = vi.spyOn(form, 'markAsPristine');

      // When
      service.resetForm(form);

      // Then
      expect(resetSpy).toHaveBeenCalled();
      expect(markAsUntouchedSpy).toHaveBeenCalled();
      expect(markAsPristineSpy).toHaveBeenCalled();
    });
  });

  describe('clearField', () => {
    let form: FormGroup;
    let nameControl: FormControl;

    beforeEach(() => {
      nameControl = new FormControl('John Doe', Validators.required);
      nameControl.markAsTouched();
      nameControl.markAsDirty();
      form = new FormGroup({
        name: nameControl,
      });
    });

    it('should clear field value and validation states', () => {
      // Given
      const setValueSpy = vi.spyOn(nameControl, 'setValue');
      const markAsUntouchedSpy = vi.spyOn(nameControl, 'markAsUntouched');
      const markAsPristineSpy = vi.spyOn(nameControl, 'markAsPristine');

      // When
      service.clearField(form, 'name');

      // Then
      expect(setValueSpy).toHaveBeenCalledWith('');
      expect(markAsUntouchedSpy).toHaveBeenCalled();
      expect(markAsPristineSpy).toHaveBeenCalled();
    });

    it('should do nothing for non-existent field', () => {
      // Given
      // Form with existing fields, requesting to clear non-existent field

      // When & Then
      expect(() => {
        service.clearField(form, 'nonExistent');
      }).not.toThrow();
    });
  });
});
