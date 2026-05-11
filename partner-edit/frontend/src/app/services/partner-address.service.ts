import {Injectable} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {PartnerEditDto} from '../api';

export interface AddressFormData {
  company1?: string;
  company2?: string;
  company3?: string;
  firstname?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  alphacode?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerAddressService {

  extractFormDataFromPartner(partner: PartnerEditDto): AddressFormData {
    return {
      company1: partner.name1 ?? '',
      company2: partner.name2 ?? '',
      company3: partner.name3 ?? '',
      firstname: partner.firstname ?? '',
      street: partner.street ?? '',
      houseNumber: partner.houseNumber ?? '',
      postalCode: partner.postalCode ?? '',
      city: partner.city ?? '',
      alphacode: partner.alphaCode ?? '',
    };
  }

  populateFormFromPartner(form: FormGroup, partner: PartnerEditDto): void {
    const formData = this.extractFormDataFromPartner(partner);
    form.patchValue(formData, {emitEvent: false});
  }

  convertFormToPartnerDto(formData: AddressFormData): Partial<PartnerEditDto> {
    return {
      name1: formData.company1 ?? '',
      name2: formData.company2 ?? '',
      name3: formData.company3 ?? '',
      firstname: formData.firstname ?? '',
      street: formData.street ?? '',
      houseNumber: formData.houseNumber ?? '',
      postalCode: formData.postalCode ?? '',
      city: formData.city ?? '',
      alphaCode: formData.alphacode ?? '',
    };
  }
}
