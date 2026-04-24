import {Injectable} from '@angular/core';
import {PartnerEditDto} from '../api';

@Injectable({
  providedIn: 'root',
})
export class PartnerDataMergeService {

  mergePartnerData(
    currentPartner: PartnerEditDto,
    updates: Partial<PartnerEditDto>,
  ): PartnerEditDto {
    if (!currentPartner || !updates) {
      throw new Error('Cannot merge partner data: missing current partner or updates');
    }
    return {...currentPartner, ...updates};
  }
}
