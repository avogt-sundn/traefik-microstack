/* eslint-disable max-lines */
// TODO: fix file size with signal forms refactoring [FIT-307]
import {inject, Injectable} from '@angular/core';
import {ValidationErrors} from '@angular/forms';
import {TranslocoService} from '@jsverse/transloco';

export interface FieldValidationConfig {
  displayName: string;
  errorMessages?: Record<string, string>;
}

export type ValidationErrorType = 'numbersOnly' | 'alphanumeric' | 'lettersOnly' | 'custom';

export interface DtoValidationError {
  key: string;
  params?: Record<string, string | number>;
}

@Injectable({
  providedIn: 'root',
})
export class ValidationErrorService {
  private readonly translocoService = inject(TranslocoService);

  getFieldError(errors: ValidationErrors | null, config: FieldValidationConfig): string | null {
    if (!errors) {
      return null;
    }

    const { displayName, errorMessages } = config;

    // Check for custom error messages first (highest priority)
    if (errorMessages) {
      for (const [
        errorKey,
        customMessage,
      ] of Object.entries(errorMessages)) {
        if (errors[errorKey]) {
          return customMessage;
        }
      }
    }

    // Handle standard Angular validators
    if (errors['required']) {
      return this.translocoService.translate('forms.validation.required', { fieldName: displayName });
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength']?.requiredLength;
      return this.translocoService.translate('forms.validation.minLength', {
        fieldName: displayName,
        min: requiredLength,
      });
    }

    if (errors['maxlength']) {
      const requiredLength = errors['maxlength']?.requiredLength;
      return this.translocoService.translate('forms.validation.maxLength', {
        fieldName: displayName,
        max: requiredLength,
      });
    }

    if (errors['pattern']) {
      return this.translocoService.translate('forms.validation.pattern', { fieldName: displayName });
    }

    if (errors['email']) {
      return this.translocoService.translate('forms.validation.email', { fieldName: displayName });
    }

    if (errors['min']) {
      const min = errors['min']?.min;
      return this.translocoService.translate('forms.validation.min', {
        fieldName: displayName,
        min: min,
      });
    }

    if (errors['max']) {
      const max = errors['max']?.max;
      return this.translocoService.translate('forms.validation.max', {
        fieldName: displayName,
        max: max,
      });
    }

    // Handle custom validators from GlobalValidators
    if (errors['decimal']) {
      return this.translocoService.translate('forms.validation.decimal', { fieldName: displayName });
    }

    if (errors['maxSum']) {
      return this.translocoService.translate('forms.validation.maxSum');
    }

    // Handle IBAN validation error
    if (errors['ibanInvalid']) {
      return this.translocoService.translate('forms.validation.ibanInvalid');
    }

    // Form-level validators
    if (errors['atLeastOneField']) {
      const minLength = errors['atLeastOneField']?.minLength || 3;
      return this.translocoService.translate('forms.validation.atLeastOneField', { minLength: minLength });
    }

    // Handle server validation errors (from PartnerDTO validation)
    if (errors['serverError']) {
      const serverError = errors['serverError'];
      // For now, return the server error directly or a generic message
      if (typeof serverError === 'string') {
        return serverError;
      }
      return this.translocoService.translate('forms.validation.serverError', {fieldName: displayName});
    }

    // Generic fallback
    return this.translocoService.translate('forms.validation.generic', { fieldName: displayName });
  }

  /**
   * Enhanced method for validated-form-field component that includes DTO validation
   */
  getFieldErrorWithDtoSupport(
    errors: ValidationErrors | null,
    displayName: string,
    dtoError: string | DtoValidationError | null,
    errorType: ValidationErrorType | null = null,
    allowWildcard = false,
    customErrorMessages: Record<string, string> = {},
  ): string | null {
    // DTO validation has highest priority
    if (dtoError) {
      return this.resolveDtoError(dtoError);
    }

    // Use enhanced error messages for pattern validation
    const enhancedConfig: FieldValidationConfig = {
      displayName,
      errorMessages: this.getEnhancedErrorMessages(errorType, allowWildcard, customErrorMessages, displayName),
    };

    return this.getFieldError(errors, enhancedConfig);
  }

  private resolveDtoError(dtoError: string | DtoValidationError): string {
    // Handle legacy string errors (backward compatibility)
    if (typeof dtoError === 'string') {
      return dtoError;
    }

    // Handle new object structure with key and params
    if (typeof dtoError === 'object' && dtoError.key) {
      return this.translocoService.translate(dtoError.key, dtoError.params || {});
    }

    // Fallback for unexpected structure
    return this.translocoService.translate('forms.validation.generic', {fieldName: 'Field'});
  }

  /**
   * Generate enhanced error messages with hints for specific error types
   */
  private getEnhancedErrorMessages(
    errorType: ValidationErrorType | null,
    allowWildcard: boolean,
    customErrorMessages: Record<string, string>,
    displayName: string,
  ): Record<string, string> {
    // Custom error messages take precedence
    if (Object.keys(customErrorMessages).length > 0) {
      return customErrorMessages;
    }

    // No error type - use standard messages
    if (!errorType) {
      return {};
    }

    // Generate pattern error messages with hints
    const errorMessages: Record<string, string> = {};

    switch (errorType) {
    case 'numbersOnly':
      const numbersHint = allowWildcard
        ? 'forms.validation.hints.numbersWithWildcard'
        : 'forms.validation.hints.numbersOnly';
      errorMessages['pattern'] = this.buildPatternErrorWithHint(displayName, numbersHint);
      break;

    case 'alphanumeric':
      const alphanumericHint = allowWildcard
        ? 'forms.validation.hints.alphanumericWithWildcard'
        : 'forms.validation.hints.alphanumeric';
      errorMessages['pattern'] = this.buildPatternErrorWithHint(displayName, alphanumericHint);
      break;

    case 'lettersOnly':
      const lettersHint = allowWildcard
        ? 'forms.validation.hints.lettersWithWildcard'
        : 'forms.validation.hints.lettersOnly';
      errorMessages['pattern'] = this.buildPatternErrorWithHint(displayName, lettersHint);
      break;
    }

    return errorMessages;
  }

  private buildPatternErrorWithHint(displayName: string, hintKey: string): string {
    const patternMessage = this.translocoService.translate('forms.validation.pattern', {fieldName: displayName});
    const hint = this.translocoService.translate(hintKey);
    return `${patternMessage} (${hint})`;
  }
}
