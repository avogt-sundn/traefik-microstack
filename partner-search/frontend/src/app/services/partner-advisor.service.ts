import {inject, Injectable} from '@angular/core';
import {lastValueFrom} from 'rxjs';
import {TranslocoService} from '@jsverse/transloco';
import {PartnerDto, PartnerGatewayService} from '../api';
import {AdvisorTreeNodeData, AdvisorTreetableService} from './advisor-treetable-service/advisor-treetable.service';
import {ADDRESS_TYPE_IDS, PARTNER_FUNCTION_IDS} from '../util/model/partner.constants';

export interface AdvisorAssignmentResult {
  success: boolean;
  advisorNumber?: number;
  errorMessage?: string;
}

export interface AdvisorDisplayInfo {
  advisorDisplay: string;
  branchDisplay: string;
}

// Assisted by AI
@Injectable({
  providedIn: 'root',
})
export class PartnerAdvisorService {

  readonly treeIconConfigs = [
    {
      columnKey: 'name',
      valueFormatter: (data: AdvisorTreeNodeData) => {
        return data.type === 'advisor' && !data.isActive ? 'advisor_inactive' : data.type;
      },
      iconMap: new Map([
        [
          'branch',
          'business',
        ],
        [
          'advisor',
          'person',
        ],
        [
          'advisor_inactive',
          'person_outline',
        ],
      ]),
      colorMap: new Map([
        [
          'branch',
          'var(--traefik-microstack-icon-primary)',
        ],
        [
          'advisor',
          'var(--traefik-microstack-icon-secondary)',
        ],
        [
          'advisor_inactive',
          'var(--traefik-microstack-icon-tertiary)',
        ],
      ]),
    },
  ];
  private readonly translocoService = inject(TranslocoService);
  private readonly partnerGatewayService = inject(PartnerGatewayService);

  getTreeDisplayedColumns() {
    return [{key: 'name', label: this.translocoService.translate('partner.view.advisor.tree.columnName')}];
  }

  async assignAdvisorByPostalCode(partner: PartnerDto): Promise<AdvisorAssignmentResult> {
    const postalCode = this.getMainAddressPostalCode(partner);

    if (!postalCode) {
      return {
        success: false,
        errorMessage: 'partner.view.advisor.messages.assignmentRequired',
      };
    }

    try {
      const postalCodeAreaFocus = await lastValueFrom(
        this.partnerGatewayService.findByPostalCode(postalCode),
      );

      if (!postalCodeAreaFocus?.areaNumber) {
        return {
          success: false,
          errorMessage: 'partner.view.advisor.messages.noAreaForPostalCode',
        };
      }

      return {
        success: true,
        advisorNumber: postalCodeAreaFocus.areaNumber,
      };
    } catch {
      return {
        success: false,
        errorMessage: 'partner.view.advisor.messages.assignmentError',
      };
    }
  }

  getMainAddressPostalCode(partner: PartnerDto): string | undefined {
    const partnerMainLocation = partner.contactPersons?.find(cp =>
      cp.partnerFunctionId === PARTNER_FUNCTION_IDS.PARTNER_HAUPTANSCHRIFT,
    );
    const partnerMainAddress = partnerMainLocation?.addresses?.find(addr =>
      addr.addressTypeId === ADDRESS_TYPE_IDS.HAUPTANSCHRIFT,
    );
    return partnerMainAddress?.postalCode;
  }

  createAdvisorDisplayInfo(
    advisorNumber: string,
    advisorTreetableService: AdvisorTreetableService,
  ): AdvisorDisplayInfo {
    const trimmedAdvisorNumber = advisorNumber.trim();
    const advisorData = advisorTreetableService.findAdvisorByNumber(trimmedAdvisorNumber);
    const advisorDisplay = advisorData?.areaName
      ? `${advisorData.areaName} (${trimmedAdvisorNumber})`
      : trimmedAdvisorNumber;
    let branchDisplay = '';
    if (advisorData?.branchNumber) {
      const branchData = advisorTreetableService.findBranchByNumber(advisorData.branchNumber);
      branchDisplay = branchData?.designation || '';
    }
    return {
      advisorDisplay,
      branchDisplay,
    };
  }

  shouldEmitAdvisorChange(
    nodeType: string,
    advisorNumber: string | undefined,
    isActive: boolean | undefined,
    isEditMode: boolean,
  ): { shouldEmitChange: boolean; advisorNumber?: string } {
    if (nodeType !== 'advisor' || !advisorNumber) {
      return { shouldEmitChange: false };
    }

    const trimmedAdvisorNumber = advisorNumber.trim();
    // Only emit change if in edit mode and advisor is active
    const shouldEmitChange = isEditMode && (isActive ?? false);
    return {
      shouldEmitChange,
      advisorNumber: shouldEmitChange ? trimmedAdvisorNumber : undefined,
    };
  }

  validateAssignmentPermissions(isEditMode: boolean, postalCode?: string): string | null {
    if (!postalCode) {
      return 'partner.view.advisor.messages.assignmentRequired';
    }
    if (!isEditMode) {
      return 'partner.view.advisor.messages.assignmentNotAllowedInViewMode';
    }
    return null;
  }
}
