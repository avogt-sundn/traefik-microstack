// Assisted by AI
import {Injectable} from '@angular/core';
import {TelecommunicationDto} from '../api';
import {TELKOM_TYPE_IDS} from '../util/model/partner.constants';
import {Phone} from '@traefik-microstack/shared';

export interface TelecommunicationFormValue {
  phonePrefix?: string;
  phoneNumber?: string;
  mobilePrefix?: string;
  mobileNumber?: string;
  email?: string;
  emailSepa?: string;
}

/**
 * Service for building TelecommunicationDto objects
 * Provides consistent construction of phone, mobile, and email telecommunications
 */
@Injectable({
  providedIn: 'root',
})
export class TelecommunicationBuilderService {

  /**
   * Builds a phone/mobile telecommunication entry
   */
  buildPhoneEntry(
    telecommunicationType: number,
    prefix: string | undefined,
    number: string | undefined,
    personId: number | undefined,
    addressId: number | undefined,
  ): TelecommunicationDto | null {
    const trimmedPrefix = prefix?.trim();
    const trimmedNumber = number?.trim();
    if (!trimmedPrefix && !trimmedNumber) return null;
    const phoneParts = Phone.parsePhonePrefix(trimmedPrefix || '');
    return {
      telecommunicationType,
      countryCode: phoneParts.countryCode,
      areaCode: phoneParts.areaCode,
      phoneNumber: trimmedNumber || '',
      personId,
      addressId,
    };
  }

  /**
   * Builds an email telecommunication entry
   */
  buildEmailEntry(
    telecommunicationType: number,
    email: string | undefined,
    personId: number | undefined,
    addressId: number | undefined,
  ): TelecommunicationDto | null {
    const trimmedEmail = email?.trim();
    if (!trimmedEmail) return null;
    return {
      telecommunicationType,
      email: trimmedEmail,
      personId,
      addressId,
    };
  }

  /**
   * Merges form telecommunications with existing telecommunications
   * Updates/adds/removes phone, mobile, and both email types while preserving other types
   */
  mergeTelecommunications(
    existingTelecoms: TelecommunicationDto[],
    formValue: TelecommunicationFormValue,
    personId: number | undefined,
    addressId: number | undefined,
  ): TelecommunicationDto[] {
    const updatedTelecoms = [...existingTelecoms];
    this.mergePhoneEntry(
      updatedTelecoms, TELKOM_TYPE_IDS.HAUPTNUMMER, formValue.phonePrefix, formValue.phoneNumber, personId, addressId);
    this.mergePhoneEntry(
      updatedTelecoms,
      TELKOM_TYPE_IDS.MOBILTELEFON,
      formValue.mobilePrefix,
      formValue.mobileNumber,
      personId,
      addressId);
    this.mergeEmailEntry(
      updatedTelecoms, TELKOM_TYPE_IDS.EMAIL, formValue.email, personId, addressId);
    this.mergeEmailEntry(
      updatedTelecoms, TELKOM_TYPE_IDS.EMAIL_VORANKUENDIGUNG, formValue.emailSepa, personId, addressId);
    return updatedTelecoms;
  }

  /**
   * Merges a phone entry into the telecommunications array
   * Updates existing, adds new, or removes if empty
   */
  private mergePhoneEntry(
    telecoms: TelecommunicationDto[],
    type: number,
    prefix: string | undefined,
    number: string | undefined,
    personId: number | undefined,
    addressId: number | undefined,
  ): void {
    const index = telecoms.findIndex(tel => tel.telecommunicationType === type);
    const newEntry = this.buildPhoneEntry(type, prefix, number, personId, addressId);

    if (newEntry) {
      this.updateOrAddTelecomEntry(telecoms, index, newEntry);
    } else if (index >= 0) {
      this.removeTelecomEntry(telecoms, index);
    }
  }

  /**
   * Merges an email entry into the telecommunications array
   * Updates existing, adds new, or removes if empty
   */
  private mergeEmailEntry(
    telecoms: TelecommunicationDto[],
    type: number,
    email: string | undefined,
    personId: number | undefined,
    addressId: number | undefined,
  ): void {
    const index = telecoms.findIndex(tel => tel.telecommunicationType === type);
    const newEntry = this.buildEmailEntry(type, email, personId, addressId);
    if (newEntry) {
      this.updateOrAddTelecomEntry(telecoms, index, newEntry);
    } else if (index >= 0) {
      this.removeTelecomEntry(telecoms, index);
    }
  }

  private updateOrAddTelecomEntry(telecoms: TelecommunicationDto[], index: number, newEntry: TelecommunicationDto) {
    if (index >= 0) {
      telecoms[index] = {...telecoms[index], ...newEntry};
    } else {
      telecoms.push(newEntry);
    }
  }

  private removeTelecomEntry(telecoms: TelecommunicationDto[], index: number) {
    telecoms.splice(index, 1);
  }

}
