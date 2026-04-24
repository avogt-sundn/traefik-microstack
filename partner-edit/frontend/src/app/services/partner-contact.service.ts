// Assisted by AI
import {inject, Injectable} from '@angular/core';
import {AddressDto, ContactPersonDto, TelecommunicationDto} from '../api';
import {ADDRESS_TYPE_IDS, PARTNER_FUNCTION_IDS, TELKOM_TYPE_IDS} from '../util/model/partner.constants';
import {Phone, parseDateToISO} from '@traefik-microstack/shared';
import {TelecommunicationBuilderService} from './telecommunication-builder.service';

@Injectable({
  providedIn: 'root',
})
export class PartnerContactService {
  private readonly telecomBuilder = inject(TelecommunicationBuilderService);

  getPersonName(contactPerson: ContactPersonDto): string {
    const parts = [
      contactPerson.firstName,
      contactPerson.name1,
      contactPerson.name2,
      contactPerson.name3,
    ].filter(part => part?.trim());
    return parts.join(' ') || '';
  }

  getPersonAddress(contactPerson: ContactPersonDto): string {
    const primaryAddress = contactPerson.addresses?.[0];
    if (!primaryAddress) return '';
    const addressParts = [
      primaryAddress.street,
      primaryAddress.houseNumber,
      primaryAddress.postalCode,
      primaryAddress.city,
    ].filter(part => part?.trim());
    return addressParts.join(' ') || '';
  }

  getFormattedBirthDate(contactPerson: ContactPersonDto): string {
    if (!contactPerson.dateOfBirth) return '';
    try {
      const date = new Date(contactPerson.dateOfBirth);
      return date.toLocaleDateString('de-DE');
    } catch {
      return contactPerson.dateOfBirth;
    }
  }

  getPhoneNumber(contactPerson: ContactPersonDto): string {
    return this.getTelecommunicationByTypeId(contactPerson, TELKOM_TYPE_IDS.HAUPTNUMMER) || '';
  }

  getMobileNumber(contactPerson: ContactPersonDto): string {
    return this.getTelecommunicationByTypeId(contactPerson, TELKOM_TYPE_IDS.MOBILTELEFON) || '';
  }

  getFunctionName(contactPerson: ContactPersonDto): string {
    return contactPerson.partnerFunction?.functionDescription || '';
  }

  getTelecommunicationByTypeId(contactPerson: ContactPersonDto, typeId: number): string | null {
    if (!contactPerson.addresses) return null;
    for (const address of contactPerson.addresses) {
      if (!address.telecommunications) continue;
      for (const telecom of address.telecommunications) {
        if (telecom.telecommunicationType === typeId) return this.formatPhoneNumber(telecom);
      }
    }
    return null;
  }

  formatPhoneNumber(telecom: TelecommunicationDto): string {
    return Phone.formatPhoneNumber(telecom.countryCode, telecom.areaCode, telecom.phoneNumber);
  }

  parseContactPersonFromTableRow(
    row: { name: string; address: string; phone: string; mobile: string; birthDate: string; function: string },
    original: ContactPersonDto | undefined,
    partnerNumber: number | undefined,
  ): ContactPersonDto {
    const nameParts = (row.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const name1 = nameParts[1] || '';
    const name2 = nameParts[2] || '';
    const name3 = nameParts[3] || '';

    // Use address data from original (from dialog), don't parse display string
    const originalAddress = original?.addresses?.[0];
    const street = originalAddress?.street || '';
    const houseNumber = originalAddress?.houseNumber || '';
    const postalCode = originalAddress?.postalCode || '';
    const city = originalAddress?.city || '';

    const phoneData = Phone.parseFullPhoneNumber(row.phone || '');
    const mobileData = Phone.parseFullPhoneNumber(row.mobile || '');

    const existingTelecoms = original?.addresses?.[0]?.telecommunications || [];
    const telecommunications = this.telecomBuilder.mergeTelecommunications(
      existingTelecoms,
      {
        phonePrefix: Phone.formatPhonePrefix(phoneData.countryCode, phoneData.areaCode),
        phoneNumber: phoneData.phoneNumber,
        mobilePrefix: Phone.formatPhonePrefix(mobileData.countryCode, mobileData.areaCode),
        mobileNumber: mobileData.phoneNumber,
      },
      original?.personId,
      original?.addresses?.[0]?.addressId,
    );

    const address: AddressDto = {
      addressTypeId: ADDRESS_TYPE_IDS.HAUPTANSCHRIFT,
      street,
      houseNumber,
      postalCode,
      city,
      telecommunications,
      personId: original?.personId,
      addressId: original?.addresses?.[0]?.addressId,
    };

    return {
      ...original,
      personId: original?.personId,
      partnerNumber,
      partnerFunctionId: original?.partnerFunctionId || PARTNER_FUNCTION_IDS.PARTNER_ANSPRECHPARTNER,
      firstName,
      name1,
      name2,
      name3,
      dateOfBirth: parseDateToISO(row.birthDate),
      addresses: [address],
      partnerFunction: {
        partnerFunctionId: original?.partnerFunctionId || PARTNER_FUNCTION_IDS.PARTNER_ANSPRECHPARTNER,
        functionDescription: row.function,
      },
    } as ContactPersonDto;
  }

  updateOrAddContactPerson(
    allContactPersons: ContactPersonDto[],
    contactPerson: ContactPersonDto,
    isEditMode: boolean,
    index?: number,
  ): ContactPersonDto[] {
    if (isEditMode) {
      if (contactPerson.personId) {
        return allContactPersons.map((cp) =>
          cp.personId === contactPerson.personId ? contactPerson : cp,
        );
      } else if (index !== undefined) {
        const filteredList = this.filterOutMainAddress(allContactPersons);
        const mainAddress = allContactPersons.find(
          cp => cp.partnerFunctionId === PARTNER_FUNCTION_IDS.PARTNER_HAUPTANSCHRIFT,
        );
        const updatedFiltered = filteredList.map((cp, i) =>
          i === index ? contactPerson : cp,
        );
        return mainAddress ? [
          mainAddress,
          ...updatedFiltered,
        ] : updatedFiltered;
      }
    }
    return [
      ...allContactPersons,
      contactPerson,
    ];
  }

  filterOutMainAddress(contactPersons: ContactPersonDto[]): ContactPersonDto[] {
    return contactPersons.filter(
      cp => cp.partnerFunctionId !== PARTNER_FUNCTION_IDS.PARTNER_HAUPTANSCHRIFT,
    );
  }
}
