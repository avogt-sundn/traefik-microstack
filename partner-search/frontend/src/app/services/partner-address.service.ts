/* eslint-disable max-lines */
// TODO FIT-218: fix linting error
import {inject, Injectable} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {AddressDto, ContactPersonDto, PartnerDto, TelecommunicationDto} from '../api';
import {ADDRESS_TYPE_IDS, PARTNER_FUNCTION_IDS, TELKOM_TYPE_IDS} from '../util/model/partner.constants';
import {Phone} from '@traefik-microstack/shared';
import {TelecommunicationBuilderService} from './telecommunication-builder.service';

export interface AddressFormData {
  company1?: string;
  company2?: string;
  company3?: string;
  street?: string;
  houseNumber?: string;
  country?: number;
  postalCode?: string;
  city?: string;
  phonePrefix?: string;
  phoneNumber?: string;
  mobilePrefix?: string;
  mobileNumber?: string;
  sepaEmailNotification?: string;
  alphacode?: string;
}

// Assisted by AI
@Injectable({
  providedIn: 'root',
})
export class PartnerAddressService {
  private readonly telecomBuilder = inject(TelecommunicationBuilderService);

  /**
   * Extracts address form data from PartnerDto
   * Finds main contact person, address, and telecommunications
   */
  extractFormDataFromPartner(partner: PartnerDto): AddressFormData {
    const partnerMainLocation = this.findMainContactPerson(partner);
    const partnerMainAddress = this.findMainAddress(partnerMainLocation);
    const partnerMainTelephone = this.findMainTelephone(partnerMainAddress?.telecommunications);
    const partnerMobileTelephone = this.findMobileTelephone(partnerMainAddress?.telecommunications);

    return {
      company1: partnerMainLocation?.name1 || '',
      company2: partnerMainLocation?.name2 || '',
      company3: partnerMainLocation?.name3 || '',
      street: partnerMainAddress?.street || '',
      houseNumber: partnerMainAddress?.houseNumber || '',
      country: partnerMainAddress?.countryId,
      postalCode: partnerMainAddress?.postalCode || '',
      city: partnerMainAddress?.city || '',
      phonePrefix: Phone.formatPhonePrefix(partnerMainTelephone?.countryCode, partnerMainTelephone?.areaCode),
      phoneNumber: partnerMainTelephone?.phoneNumber || '',
      mobilePrefix: Phone.formatPhonePrefix(partnerMobileTelephone?.countryCode, partnerMobileTelephone?.areaCode),
      mobileNumber: partnerMobileTelephone?.phoneNumber || '',
      sepaEmailNotification: this.findEmailSepaNotification(partnerMainAddress?.telecommunications)?.email || '',
      alphacode: partnerMainLocation?.alphaCode || '',
    };
  }

  /**
   * Populates form with partner data without triggering change events
   */
  populateFormFromPartner(form: FormGroup, partner: PartnerDto): void {
    const formData = this.extractFormDataFromPartner(partner);
    form.patchValue(formData, {emitEvent: false});
  }

  /**
   * Converts form data to partial PartnerDTO structure
   * Maintains proper nested DTO patterns with merge-safe updates
   */
  convertFormToPartnerDto(formData: AddressFormData, currentPartner: PartnerDto): Partial<PartnerDto> {
    // Create or update main contact person (Hauptanschrift)
    const existingContactPersons = currentPartner?.contactPersons || [];
    let mainContactPerson = this.findMainContactPerson(currentPartner);

    mainContactPerson ??= {
      partnerFunctionId: PARTNER_FUNCTION_IDS.PARTNER_HAUPTANSCHRIFT,
      partnerNumber: currentPartner?.partnerNumber,
      name1: '',
      alphaCode: '',
      addresses: [],
    };

    // Update contact person data
    const updatedContactPerson: ContactPersonDto = {
      ...mainContactPerson,
      partnerFunctionId: mainContactPerson?.partnerFunctionId ?? PARTNER_FUNCTION_IDS.PARTNER_HAUPTANSCHRIFT,
      name1: formData.company1 || '',
      name2: formData.company2 || '',
      name3: formData.company3 || '',
      alphaCode: formData.alphacode || '',
    };

    // Create or update main address
    const existingAddresses = updatedContactPerson.addresses || [];
    let mainAddress = this.findMainAddress(updatedContactPerson);

    mainAddress ??= {
      addressTypeId: ADDRESS_TYPE_IDS.HAUPTANSCHRIFT,
      personId: updatedContactPerson.personId,
      telecommunications: [],
      postalCode: '',
      city: '',
      street: '',
      houseNumber: '',
    };

    const updatedAddress = {
      ...mainAddress,
      street: formData.street || '',
      houseNumber: formData.houseNumber || '',
      postalCode: formData.postalCode || '',
      city: formData.city || '',
      countryId: typeof formData.country === 'number' ? formData.country : undefined,
    } as AddressDto;

    // Handle telecommunications updates
    updatedAddress.telecommunications = this.telecomBuilder.mergeTelecommunications(
      updatedAddress.telecommunications || [],
      {
        phonePrefix: formData.phonePrefix,
        phoneNumber: formData.phoneNumber,
        mobilePrefix: formData.mobilePrefix,
        mobileNumber: formData.mobileNumber,
        emailSepa: formData.sepaEmailNotification,
      },
      updatedContactPerson.personId,
      updatedAddress.addressId,
    ) as TelecommunicationDto[];

    // Update addresses array
    const addressIndex = existingAddresses.findIndex((addr: AddressDto) =>
      addr.addressTypeId === ADDRESS_TYPE_IDS.HAUPTANSCHRIFT,
    );
    const updatedAddresses = [...existingAddresses];
    if (addressIndex >= 0) {
      updatedAddresses[addressIndex] = updatedAddress;
    } else {
      updatedAddresses.push(updatedAddress);
    }

    updatedContactPerson.addresses = updatedAddresses;

    // Update contact persons array
    const contactPersonIndex = existingContactPersons.findIndex((cp: ContactPersonDto) =>
      cp.partnerFunctionId === PARTNER_FUNCTION_IDS.PARTNER_HAUPTANSCHRIFT,
    );
    const updatedContactPersons = [...existingContactPersons];
    if (contactPersonIndex >= 0) {
      updatedContactPersons[contactPersonIndex] = updatedContactPerson;
    } else {
      updatedContactPersons.push(updatedContactPerson);
    }

    return {
      contactPersons: updatedContactPersons,
    };
  }

  /**
   * Helper methods for finding specific data structures
   */
  private findMainContactPerson(partner?: PartnerDto): ContactPersonDto | undefined {
    return partner?.contactPersons?.find((cp: ContactPersonDto) =>
      cp.partnerFunctionId === PARTNER_FUNCTION_IDS.PARTNER_HAUPTANSCHRIFT,
    );
  }

  private findMainAddress(contactPerson?: ContactPersonDto): AddressDto | undefined {
    return contactPerson?.addresses?.find((addr: AddressDto) =>
      addr.addressTypeId === ADDRESS_TYPE_IDS.HAUPTANSCHRIFT,
    );
  }

  private findMainTelephone(telecommunications?: TelecommunicationDto[]): TelecommunicationDto | undefined {
    return telecommunications?.find((tel: TelecommunicationDto) =>
      tel.telecommunicationType === TELKOM_TYPE_IDS.HAUPTNUMMER,
    );
  }

  private findMobileTelephone(telecommunications?: TelecommunicationDto[]): TelecommunicationDto | undefined {
    return telecommunications?.find((tel: TelecommunicationDto) =>
      tel.telecommunicationType === TELKOM_TYPE_IDS.MOBILTELEFON,
    );
  }

  private findEmailSepaNotification(telecommunications?: TelecommunicationDto[]): TelecommunicationDto | undefined {
    return telecommunications?.find((tel: TelecommunicationDto) =>
      tel.telecommunicationType === TELKOM_TYPE_IDS.EMAIL_VORANKUENDIGUNG,
    );
  }
}
