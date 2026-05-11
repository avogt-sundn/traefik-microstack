import {inject, Injectable} from '@angular/core';
import {firstValueFrom} from 'rxjs';

import {TreetableBaseService} from '../../components/basic/treetable/treetable-base.service';
import {TreeNode} from '../../components/basic/treetable/treetable.types';
import {BranchDto, PartnerGatewayService, SalesAreaFocusDto} from '../../api';

// Assisted by AI
export interface AdvisorTreeNodeData {
  type: 'branch' | 'advisor';
  branchNumber?: number;
  name1?: string;
  advisorNumber?: string;
  isActive?: boolean;
}

@Injectable()
export class AdvisorTreetableService extends TreetableBaseService<AdvisorTreeNodeData> {
  advisorsData: SalesAreaFocusDto[] = [];
  private readonly partnerGatewayService = inject(PartnerGatewayService);
  private branchesData: BranchDto[] = [];

  reset(): void {
    this.branchesData = [];
    this.advisorsData = [];
  }

  async initializeWithSalesAreaData(): Promise<void> {
    this.reset();

    try {
      const response = await firstValueFrom(
        this.partnerGatewayService.getSalesAreaData(),
      );

      this.branchesData = response.branches || [];
      this.advisorsData = response.salesAreaFocus || [];
    } catch {
      this.branchesData = [];
      this.advisorsData = [];
    }
  }

  async getInitialTree(): Promise<TreeNode<AdvisorTreeNodeData>[]> {
    const advisorsByBranch = new Map<number, SalesAreaFocusDto[]>();

    this.advisorsData.forEach(advisor => {
      if (advisor.branchNumber) {
        if (!advisorsByBranch.has(advisor.branchNumber)) {
          advisorsByBranch.set(advisor.branchNumber, []);
        }
        advisorsByBranch.get(advisor.branchNumber)!.push(advisor);
      }
    });

    return this.branchesData
      .sort((a, b) => {
        const aName = a.city && a.designation ? `${a.city} - ${a.designation}` : (a.designation || a.city || '');
        const bName = b.city && b.designation ? `${b.city} - ${b.designation}` : (b.designation || b.city || '');
        return aName.localeCompare(bName);
      })
      .map(branch => {
        const branchAdvisors = advisorsByBranch.get(branch.branchNumber) || [];

        return {
          data: {
            type: 'branch',
            branchNumber: branch.branchNumber,
            name1: branch.city && branch.designation
              ? `${branch.city} - ${branch.designation}`
              : (branch.designation || branch.city || 'Unbekannte Filiale'),
            isActive: true,
          },
          children: branchAdvisors.length > 0 ?
            branchAdvisors
              .filter(advisor => advisor.advisorNumber && advisor.areaName)
              .sort((a, b) => (a.areaName || '').localeCompare(b.areaName || ''))
              .map(advisor => ({
                data: {
                  type: 'advisor',
                  advisorNumber: advisor.advisorNumber,
                  name1:
                    advisor.areaName
                      ? `${advisor.areaName} (${advisor.advisorNumber?.trim() || ''})`
                      : advisor.advisorNumber?.trim() || '',
                  isActive: advisor.deletionFlag === 0,
                },
                children: undefined,
              }))
            : [],
        };
      });
  }

  async getChildren(nodeData: AdvisorTreeNodeData): Promise<TreeNode<AdvisorTreeNodeData>[]> {
    if (nodeData.type !== 'branch' || !nodeData.branchNumber) {
      return [];
    }

    const branchAdvisors = this.advisorsData.filter(
      advisor => advisor.branchNumber === nodeData.branchNumber &&
                 advisor.advisorNumber &&
                 advisor.areaName,
    );

    return branchAdvisors
      .sort((a, b) => (a.areaName || '').localeCompare(b.areaName || ''))
      .map(advisor => ({
        data: {
          type: 'advisor',
          advisorNumber: advisor.advisorNumber,
          name1:
            advisor.areaName
              ? `${advisor.areaName} (${advisor.advisorNumber?.trim()})`
              : advisor.advisorNumber?.trim() || '',
          isActive: advisor.deletionFlag === 0,
        },
        children: undefined,
      }));
  }

  findAdvisorByNumber(advisorNumber: string): SalesAreaFocusDto | undefined {
    return this.advisorsData.find(advisor =>
      advisor.advisorNumber?.trim() === advisorNumber.trim(),
    );
  }

  findBranchByNumber(branchNumber: number): BranchDto | undefined {
    return this.branchesData.find(branch =>
      branch.branchNumber === branchNumber,
    );
  }

  findAdvisorByAreaNumber(areaNumber: number): SalesAreaFocusDto | undefined {
    return this.advisorsData.find(advisor =>
      advisor.areaNumber === areaNumber && advisor.deletionFlag === 0,
    );
  }
}
