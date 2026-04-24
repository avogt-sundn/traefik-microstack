import {TestBed} from '@angular/core/testing';
import {ValidationErrors} from '@angular/forms';
import {TranslocoService} from '@jsverse/transloco';
import {Mocked} from 'vitest';
import {ValidationErrorService, FieldValidationConfig} from './validation-error.service';

describe('ValidationErrorService', () => {
  let service: ValidationErrorService;
  let mockTranslocoService: Mocked<Partial<TranslocoService>>;


  beforeEach(() => {
    mockTranslocoService = {
      translate: vi.fn().mockReturnValue('mocked-translation'),
    } ;

    TestBed.configureTestingModule({
      providers: [
        ValidationErrorService,
        {provide: TranslocoService, useValue: mockTranslocoService},
      ],
    });

    service = TestBed.inject(ValidationErrorService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getFieldError', () => {
    const mockConfig: FieldValidationConfig = {
      displayName: 'Test Field',
    };

    it('should return null when no errors provided', () => {
      // Given
      const errors = null;

      // When
      const result = service.getFieldError(errors, mockConfig);

      // Then
      expect(result).toBeNull();
    });

    it('should prioritize custom error messages', () => {
      // Given
      const errors: ValidationErrors = {required: true};
      const configWithCustom: FieldValidationConfig = {
        displayName: 'Test Field',
        errorMessages: {
          required: 'Custom required message',
        },
      };

      // When
      const result = service.getFieldError(errors, configWithCustom);

      // Then
      expect(result).toBe('Custom required message');
      expect(mockTranslocoService.translate).not.toHaveBeenCalled();
    });

    // Parameterized tests for all standard validation errors
    test.each([
      {
        errorType: 'required',
        errorValue: true,
        expectedKey: 'forms.validation.required',
        expectedParams: {fieldName: 'Test Field'},
      },
      {
        errorType: 'email',
        errorValue: true,
        expectedKey: 'forms.validation.email',
        expectedParams: {fieldName: 'Test Field'},
      },
      {
        errorType: 'pattern',
        errorValue: {requiredPattern: '^[0-9]+$'},
        expectedKey: 'forms.validation.pattern',
        expectedParams: {fieldName: 'Test Field'},
      },
      {
        errorType: 'decimal',
        errorValue: true,
        expectedKey: 'forms.validation.decimal',
        expectedParams: {fieldName: 'Test Field'},
      },
      {
        errorType: 'maxSum',
        errorValue: true,
        expectedKey: 'forms.validation.maxSum',
        expectedParams: undefined,
      },
      {
        errorType: 'ibanInvalid',
        errorValue: true,
        expectedKey: 'forms.validation.ibanInvalid',
        expectedParams: undefined,
      },
      {
        errorType: 'minlength',
        errorValue: {requiredLength: 5, actualLength: 3},
        expectedKey: 'forms.validation.minLength',
        expectedParams: {fieldName: 'Test Field', min: 5},
      },
      {
        errorType: 'maxlength',
        errorValue: {requiredLength: 10, actualLength: 15},
        expectedKey: 'forms.validation.maxLength',
        expectedParams: {fieldName: 'Test Field', max: 10},
      },
      {
        errorType: 'min',
        errorValue: {min: 5, actual: 3},
        expectedKey: 'forms.validation.min',
        expectedParams: {fieldName: 'Test Field', min: 5},
      },
      {
        errorType: 'max',
        errorValue: {max: 100, actual: 150},
        expectedKey: 'forms.validation.max',
        expectedParams: {fieldName: 'Test Field', max: 100},
      },
    ])('should handle $errorType validation error', ({errorType, errorValue, expectedKey, expectedParams}) => {
      // Given
      const errors: ValidationErrors = {[errorType]: errorValue};

      // When
      const result = service.getFieldError(errors, mockConfig);

      // Then
      if (expectedParams === undefined) {
        expect(mockTranslocoService.translate).toHaveBeenCalledWith(expectedKey);
      } else {
        expect(mockTranslocoService.translate).toHaveBeenCalledWith(expectedKey, expectedParams);
      }
      expect(result).toBe('mocked-translation');
    });

    // Parameterized tests for atLeastOneField validation variants
    test.each([
      {
        errorValue: {minLength: 4},
        expectedParams: {minLength: 4},
        testCase: 'with explicit minLength',
      },
      {
        errorValue: true,
        expectedParams: {minLength: 3},
        testCase: 'with default minLength',
      },
    ])('should handle atLeastOneField validation error $testCase', ({errorValue, expectedParams}) => {
      // Given
      const errors: ValidationErrors = {atLeastOneField: errorValue};

      // When
      const result = service.getFieldError(errors, mockConfig);

      // Then
      expect(mockTranslocoService.translate).toHaveBeenCalledWith(
        'forms.validation.atLeastOneField',
        expectedParams,
      );
      expect(result).toBe('mocked-translation');
    });

    it('should handle unknown validation errors with generic message', () => {
      // Given
      const errors: ValidationErrors = {unknownError: true};

      // When
      const result = service.getFieldError(errors, mockConfig);

      // Then
      expect(mockTranslocoService.translate).toHaveBeenCalledWith(
        'forms.validation.generic',
        {fieldName: 'Test Field'},
      );
      expect(result).toBe('mocked-translation');
    });

    it('should handle missing translation', () => {
      // Given
      const errors: ValidationErrors = {required: true};
      vi.fn(mockTranslocoService.translate).mockReturnValue('');

      // When
      const result = service.getFieldError(errors, mockConfig);

      // Then
      expect(mockTranslocoService.translate).toHaveBeenCalledWith(
        'forms.validation.required',
        {fieldName: 'Test Field'},
      );
      expect(result).toBe('');
    });

    it('should handle null translation', () => {
      // Given
      const errors: ValidationErrors = {required: true};
      vi.fn(mockTranslocoService.translate).mockReturnValue(null);

      // When
      const result = service.getFieldError(errors, mockConfig);

      // Then
      expect(mockTranslocoService.translate).toHaveBeenCalledWith(
        'forms.validation.required',
        {fieldName: 'Test Field'},
      );
      expect(result).toBeNull();
    });

    it('should handle multiple errors and return first matching translation', () => {
      // Given
      const errors: ValidationErrors = {
        pattern: {requiredPattern: '^[0-9]+$'},
        required: true,
        minlength: {requiredLength: 5, actualLength: 0},
      };

      // When
      const result = service.getFieldError(errors, mockConfig);

      // Then
      expect(mockTranslocoService.translate).toHaveBeenCalledWith(
        'forms.validation.required',
        {fieldName: 'Test Field'},
      );
      expect(mockTranslocoService.translate).toHaveBeenCalledTimes(1);
      expect(result).toBe('mocked-translation');
    });

    it('should prioritize first custom error message with multiple errors', () => {
      // Given
      const errors: ValidationErrors = {
        required: true,
        minlength: {requiredLength: 5, actualLength: 0},
        pattern: {requiredPattern: '^[0-9]+$'},
      };
      const configWithMultipleCustom: FieldValidationConfig = {
        displayName: 'Test Field',
        errorMessages: {
          minlength: 'Custom minlength message',
          pattern: 'Custom pattern message',
        },
      };

      // When
      const result = service.getFieldError(errors, configWithMultipleCustom);

      // Then
      expect(result).toBe('Custom minlength message');
      expect(mockTranslocoService.translate).not.toHaveBeenCalled();
    });

    it('should handle empty config displayName', () => {
      // Given
      const errors: ValidationErrors = {required: true};
      const emptyConfig: FieldValidationConfig = {
        displayName: '',
      };

      // When
      const result = service.getFieldError(errors, emptyConfig);

      // Then
      expect(mockTranslocoService.translate).toHaveBeenCalledWith(
        'forms.validation.required',
        {fieldName: ''},
      );
      expect(result).toBe('mocked-translation');
    });
  });
});
