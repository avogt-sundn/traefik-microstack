import {Injectable} from '@angular/core';
import {FormGroup} from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class FormValidationService {

  /**
   * Check if a form is valid and mark all fields as touched if invalid
   */
  validateForm(form: FormGroup): boolean {
    if (form.valid) {
      return true;
    }

    // Mark all fields as touched to show validation errors
    form.markAllAsTouched();
    return false;
  }


  /**
   * Reset form and clear all validation states
   */
  resetForm(form: FormGroup): void {
    form.reset();
    form.markAsUntouched();
    form.markAsPristine();
  }

  /**
   * Clear a specific field
   */
  clearField(form: FormGroup, fieldName: string): void {
    const control = form.get(fieldName);
    if (control) {
      control.setValue('');
      control.markAsUntouched();
      control.markAsPristine();
    }
  }

}
