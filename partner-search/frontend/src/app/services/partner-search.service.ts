import {inject, Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PartnerTreetableService} from './partner-treetable-service/partner-treetable.service';

export interface SearchState {
  partnerTreetableService: PartnerTreetableService | null;
  searchPerformed: boolean;
  hasResults: boolean;
  /** True when the search was superseded by a newer query mid-flight. Callers must not
   *  call updateSearchState() for discarded results — doing so would overwrite the outcome
   *  of the winning (newer) search. */
  discarded?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PartnerSearchService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injectedPartnerTreetableService = inject(PartnerTreetableService);

  updateUrlParam(rawQuery: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: rawQuery.trim() ? {q: rawQuery.trim()} : {},
      queryParamsHandling: 'replace',
    });
  }

  async performSearch(rawQuery: string): Promise<SearchState> {
    if (!rawQuery || !rawQuery.trim()) {
      return {partnerTreetableService: null, searchPerformed: false, hasResults: false};
    }

    try {
      const applied = await this.injectedPartnerTreetableService.initializeWithSearch(rawQuery.trim());
      if (!applied) {
        // This search was superseded by a newer one while the HTTP request was in-flight.
        // Return a sentinel so the caller knows to discard this result rather than
        // calling updateSearchState() and overwriting the newer search's outcome.
        return {partnerTreetableService: null, searchPerformed: false, hasResults: false, discarded: true};
      }
      const initialTree = await this.injectedPartnerTreetableService.getInitialTree();
      return {
        partnerTreetableService: this.injectedPartnerTreetableService,
        searchPerformed: true,
        hasResults: initialTree.length > 0,
      };
    } catch {
      return {partnerTreetableService: null, searchPerformed: true, hasResults: false};
    }
  }

  resetSearch(): SearchState {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: 'replace',
    });
    return {partnerTreetableService: null, searchPerformed: false, hasResults: false};
  }
}
