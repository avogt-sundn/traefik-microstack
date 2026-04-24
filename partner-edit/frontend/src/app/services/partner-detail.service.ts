import {Injectable, Signal, signal} from '@angular/core';
import {PartnerEditDto} from '../api';

@Injectable({
  providedIn: 'root',
})
export class PartnerDetailService {
  readonly partner: Signal<PartnerEditDto | null>
  readonly isVisible: Signal<boolean>

  private readonly selectedPartner = signal<PartnerEditDto | null>(null);
  private readonly isViewingPartner = signal<boolean>(false);

  constructor() {
    this.partner = this.selectedPartner.asReadonly();
    this.isVisible = this.isViewingPartner.asReadonly();
  }

  showPartnerDetails(partner: PartnerEditDto): void {
    this.selectedPartner.set(partner);
    this.isViewingPartner.set(true);
  }

  hidePartnerDetails(): void {
    this.isViewingPartner.set(false);
    this.selectedPartner.set(null);
  }

  setPartner(partner: PartnerEditDto): void {
    this.selectedPartner.set(partner);
  }

  createNewPartner(): void {
    this.selectedPartner.set(null);
    this.isViewingPartner.set(true);
  }
}
