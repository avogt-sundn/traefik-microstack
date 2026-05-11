import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, firstValueFrom, Subscription} from 'rxjs';

import {TreetableBaseService} from '../../components/basic/treetable/treetable-base.service';
import {TreeNode} from '../../components/basic/treetable/treetable.types';
import {PartnerGatewayService, PartnerGroupSearchDto} from '../../api';
import {QuadSearchResponse} from '../../api/model/dual-search-response';
import {PartnerFrameworkSearchService} from '../partner-framework-search.service';

export enum PartnerType {
  InternerVerbund = 'INTERNAL',
  NormalerVerbund = 'EXTERNAL',
  Partner = 'PARTNER'
}

export function getPartnerType(dto: PartnerGroupSearchDto): PartnerType {
  if (dto.type === 'P') {
    return PartnerType.Partner;
  }
  if (dto.type === 'V') {
    if (dto.groupType === 'INTERN') {
      return PartnerType.InternerVerbund;
    } else {
      return PartnerType.NormalerVerbund;
    }
  }
  return PartnerType.Partner;
}


@Injectable({
  providedIn: 'root',
})
export class PartnerTreetableService extends TreetableBaseService<PartnerGroupSearchDto> {
  private readonly partnerGatewayService = inject(PartnerGatewayService);
  private readonly partnerFrameworkSearchService = inject(PartnerFrameworkSearchService);
  private postgresResults: PartnerGroupSearchDto[] = [];
  private elasticsearchResults: PartnerGroupSearchDto[] = [];
  activeEngine: { framework: 'spring' | 'quarkus'; engine: 'postgres' | 'elasticsearch' } = { framework: 'spring', engine: 'elasticsearch' };

  /** Exposes the last quad-engine response for the source indicator UI */
  lastQuadResponse = new BehaviorSubject<QuadSearchResponse | null>(null);

  /** Monotonically increasing counter to discard stale concurrent search responses */
  private searchGeneration = 0;

  /** Active subscription to the streaming search observable */
  private searchSubscription: Subscription | null = null;

  /**
   * Reset the service state
   */
  reset(): void {
    this.searchSubscription?.unsubscribe();
    this.searchSubscription = null;
    this.postgresResults = [];
    this.elasticsearchResults = [];
    this.lastQuadResponse.next(null);
  }

  switchEngine(engine: 'postgres' | 'elasticsearch'): void {
    this.activeEngine = { ...this.activeEngine, engine };
    const frameworkResults = this.lastQuadResponse.value?.[this.activeEngine.framework];
    this.postgresResults = frameworkResults?.postgres?.results ?? [];
    this.elasticsearchResults = frameworkResults?.elasticsearch?.results ?? [];
  }

  switchFramework(framework: 'spring' | 'quarkus'): void {
    if (framework === 'quarkus' && !this.lastQuadResponse.value?.quarkusAvailable) {
      return;
    }
    this.activeEngine = { ...this.activeEngine, framework };
    const frameworkResults = this.lastQuadResponse.value?.[framework];
    this.postgresResults = frameworkResults?.postgres?.results ?? [];
    this.elasticsearchResults = frameworkResults?.elasticsearch?.results ?? [];
  }

  get currentResultCount(): number {
    return (this.activeEngine.engine === 'elasticsearch' ? this.elasticsearchResults : this.postgresResults).length;
  }

  /**
   * Initialize with raw search query and fetch data from backend.
   * Increments a generation counter so that responses from superseded (cancelled) searches
   * are silently discarded rather than overwriting the latest results.
   *
   * Subscribes to the streaming observable: resolves as soon as the active source's result
   * is non-null; continues updating lastQuadResponse on subsequent emissions (remaining
   * sources arriving) so ms badges update without re-rendering the table.
   *
   * Returns `true` if this search's result was applied (i.e. it was the latest search),
   * or `false` if it was discarded because a newer search superseded it.
   */
  initializeWithSearch(rawQuery: string): Promise<boolean> {
    // Cancel any in-flight subscription from a previous search
    this.searchSubscription?.unsubscribe();
    this.searchSubscription = null;

    const generation = ++this.searchGeneration;

    return new Promise<boolean>((resolve, reject) => {
      let resolved = false;

      this.searchSubscription = this.partnerFrameworkSearchService.search(rawQuery).subscribe({
        next: (quad) => {
          if (generation !== this.searchGeneration) {
            // A newer search was started — discard and stop processing
            this.searchSubscription?.unsubscribe();
            this.searchSubscription = null;
            if (!resolved) {
              resolved = true;
              resolve(false);
            }
            return;
          }

          const activeResult = quad[this.activeEngine.framework][this.activeEngine.engine];

          if (!resolved && activeResult !== null) {
            // Active source has arrived — apply results and resolve the promise
            this.postgresResults = quad[this.activeEngine.framework].postgres?.results ?? [];
            this.elasticsearchResults = quad[this.activeEngine.framework].elasticsearch?.results ?? [];
            this.lastQuadResponse.next(quad);
            resolved = true;
            resolve(true);
          } else if (resolved) {
            // Subsequent emission from another source — update ms badges only
            this.lastQuadResponse.next(quad);
          }
          // If not yet resolved and active result is still null, wait for next emission
        },
        error: (error) => {
          if (generation !== this.searchGeneration) {
            if (!resolved) {
              resolved = true;
              resolve(false);
            }
            return;
          }
          if (!resolved) {
            resolved = true;
            this.postgresResults = [];
            this.elasticsearchResults = [];
            reject(new Error(`Error searching partners and groups: ${error}`));
          }
        },
        complete: () => {
          // Observable completed without the active source ever returning a result
          // (e.g. all sources returned null — theoretically impossible in normal flow)
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        },
      });
    });
  }

  /**
   * Get initial tree with search results (collapsed)
   */
  async getInitialTree(): Promise<TreeNode<PartnerGroupSearchDto>[]> {
    const results = this.activeEngine.engine === 'elasticsearch' ? this.elasticsearchResults : this.postgresResults;
    return results.map(dto => ({
      data: dto,
      children: dto.type === 'V' ? [] : undefined,
    }));
  }

  /**
   * Get children for a group node (lazy loading)
   */
  async getChildren(nodeData: PartnerGroupSearchDto): Promise<TreeNode<PartnerGroupSearchDto>[]> {
    if (nodeData.type !== 'V' || !nodeData.groupNumber) {
      return [];
    }

    try {
      const response = await firstValueFrom(
        this.partnerGatewayService.getGroupMembers(nodeData.groupNumber.toString()),
      );

      return (response.members || []).map(member => ({
        data: {
          partnerNumber: member.partnerNumber,
          groupNumber: member.groupNumber,
          type: member.type || 'P',
          alphaCode: member.alphaCode,
          name1: member.name1,
          name2: member.name2,
          name3: member.name3,
          groupType: undefined,
        },
        children: member.type === 'V' ? [] : undefined,
      }));
    } catch (error) {
      throw new Error(`Error loading group members: ${error}`);
    }
  }

}
