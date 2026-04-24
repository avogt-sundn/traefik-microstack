import {computed, effect, inject, Injectable, signal, Signal} from '@angular/core';
import {Router} from '@angular/router';
import {PartnerEditDto, PartnerGatewayService} from '../api';
import {PartnerDetailService} from './partner-detail.service';
import {PartnerDataMergeService} from './partner-data-merge.service';
import {showSnackbar} from '@traefik-microstack/shared';
import {TranslocoService} from '@jsverse/transloco';

@Injectable()
export class PartnerViewStateService {
  readonly isEditMode = signal<boolean>(false);
  readonly editablePartner = signal<PartnerEditDto | null>(null);
  readonly partner: Signal<PartnerEditDto | null>;
  readonly displayPartner: Signal<PartnerEditDto>;
  readonly isNewPartner = computed(() => !this.partner()?.partnerNumber);
  private readonly partnerGatewayService = inject(PartnerGatewayService);
  private readonly partnerDataMergeService = inject(PartnerDataMergeService);
  private readonly partnerDetailService = inject(PartnerDetailService);
  private readonly router = inject(Router);
  private readonly snackbar = showSnackbar();
  private readonly transloco = inject(TranslocoService);

  constructor() {
    this.partner = this.partnerDetailService.partner;
    this.displayPartner = computed(() => {
      if (this.isEditMode()) {
        return this.editablePartner() || this.partner() || {};
      }
      return this.partner() || {};
    });

    effect(() => {
      const partner = this.partner();
      const isVisible = this.partnerDetailService.isVisible();

      if (isVisible && !partner) {
        this.enableEditMode();
      }
    });
  }

  initializeFromUrl(partnerId?: number): void {
    if (partnerId && !this.partner()) {
      this.loadPartnerFromUrl(partnerId);
    } else if (!partnerId) {
      this.partnerDetailService.createNewPartner();
    }
  }

  enableEditMode(): void {
    this.isEditMode.set(true);
    const currentPartner = this.partner();
    this.editablePartner.set(currentPartner ? structuredClone(currentPartner) : {});
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.editablePartner.set(null);
  }

  closePartnerDetails(): void {
    this.isEditMode.set(false);
    this.editablePartner.set(null);
    this.partnerDetailService.hidePartnerDetails();
    this.navigateBack();
  }

  savePartner(): void {
    const partnerData = this.editablePartner();
    if (!partnerData) return;
    const isCreatingNew = this.isNewPartner();

    this.partnerGatewayService.savePartner(partnerData.partnerNumber!, partnerData).subscribe({
      next: (savedPartner: PartnerEditDto) => {
        if (savedPartner.partnerNumber) {
          this.partnerDetailService.showPartnerDetails(savedPartner);
        } else {
          this.partnerDetailService.setPartner(savedPartner);
        }

        this.isEditMode.set(false);
        this.editablePartner.set(null);

        const successKey = isCreatingNew ? 'messages.partner.createSuccess' : 'messages.partner.updateSuccess';
        const successMessage = this.transloco.translate(successKey);
        this.snackbar.showSuccess(successMessage, {autoClose: true, duration: 3000});
      },
      error: () => {
        const errorKey = isCreatingNew ? 'messages.partner.createError' : 'messages.partner.updateError';
        const errorMessage = this.transloco.translate(errorKey);
        this.snackbar.showError(errorMessage, {autoClose: true, duration: 5000});
      },
    });
  }

  mergeTabData(tabName: string, tabData: Partial<PartnerEditDto>): void {
    const currentPartner = this.editablePartner();
    if (!currentPartner || !tabData) {
      return;
    }

    try {
      const mergedPartner = this.partnerDataMergeService.mergePartnerData(currentPartner, tabData);
      this.editablePartner.set(mergedPartner);
    } catch (error) {
      throw new Error(`Failed to merge ${tabName} data: ${error}`);
    }
  }

  private navigateBack(): void {
    const client = this.router.url.split('/')[1];
    this.router.navigate([`/${client}/partner-search/search`], {
      queryParamsHandling: 'preserve',
    });
  }

  private loadPartnerFromUrl(partnerId: number): void {
    this.partnerGatewayService.findByPartnerNumber(partnerId).subscribe({
      next: (partnerDetails) => {
        if (partnerDetails) {
          this.partnerDetailService.showPartnerDetails(partnerDetails);
        }
      },
      error: () => {
        this.navigateBack();
      },
    });
  }
}
