import {Injectable} from '@angular/core';
import {PartnerEditDto} from '../api';

export interface SaveValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerSaveValidationService {

  validateBeforeSave(partner: PartnerEditDto): SaveValidationResult {
    const errors: Record<string, string> = {};

    if (partner.type !== undefined && partner.type !== null && partner.type.length > 1) {
      errors['type'] = 'type must be at most 1 character';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
