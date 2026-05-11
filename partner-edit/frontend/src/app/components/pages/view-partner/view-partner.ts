import {Component, inject, OnInit, Signal, WritableSignal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {MatTabsModule} from '@angular/material/tabs';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {TranslocoPipe} from '@jsverse/transloco';
import {AddressTab} from './tabs/address-tab/address-tab';
import {GroupTab} from './tabs/group-tab/group-tab';
import {MfeContent, showSnackbar} from '@traefik-microstack/shared';
import {PartnerEditDto} from '../../../api';
import {PartnerSubnavbar} from '../../basic/partner-subnavbar/partner-subnavbar';
import {PartnerViewStateService} from '../../../services/partner-view-state.service';
import {PartnerSaveValidationService} from '../../../services/partner-save-validation.service';

@Component({
  selector: 'partner-view-partner',
  imports: [
    TranslocoPipe,
    MatTabsModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    AddressTab,
    GroupTab,
    MfeContent,
    PartnerSubnavbar,
  ],
  providers: [PartnerViewStateService],
  templateUrl: './view-partner.html',
  styleUrl: './view-partner.scss',
})
export class ViewPartner implements OnInit {
  readonly isEditMode: WritableSignal<boolean>
  readonly partner: Signal<PartnerEditDto | null>;
  readonly displayPartner: Signal<PartnerEditDto>;

  private readonly viewState = inject(PartnerViewStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly saveValidationService = inject(PartnerSaveValidationService);
  private readonly snackbar = showSnackbar();

  constructor() {
    this.isEditMode = this.viewState.isEditMode;
    this.partner = this.viewState.partner;
    this.displayPartner = this.viewState.displayPartner;
  }

  ngOnInit(): void {
    const partnerId = this.route.snapshot.paramMap.get('partnerId');
    this.viewState.initializeFromUrl(partnerId ? +partnerId : undefined);
  }

  closePartnerDetails(): void {
    this.viewState.closePartnerDetails();
  }

  enableEditMode(): void {
    this.viewState.enableEditMode();
  }

  savePartner(): void {
    const currentPartner = this.viewState.editablePartner();
    if (!currentPartner) {
      return;
    }

    const validationResult = this.saveValidationService.validateBeforeSave(currentPartner);

    if (validationResult.isValid) {
      this.viewState.savePartner();
    } else {
      this.snackbar.showValidationError();
    }
  }

  cancelEdit(): void {
    this.viewState.cancelEdit();
  }

  onAddressTabChanged(addressData: Partial<PartnerEditDto>): void {
    this.viewState.mergeTabData('address', addressData);
  }

  onGroupTabChanged(groupData: Partial<PartnerEditDto>): void {
    this.viewState.mergeTabData('group', groupData);
  }
}
