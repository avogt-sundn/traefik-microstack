import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {Subject, Subscription, switchMap, debounceTime, distinctUntilChanged, takeUntil, map, from} from 'rxjs';

import {PartnerSearchConfig, SearchExample} from './partner-search.config';
import {CypressIdDirective, InfoPanel, MfeContent} from '@traefik-microstack/shared';
import {Treetable} from '../../basic/treetable/treetable';
import {FlatNode} from '../../basic/treetable/treetable.types';
import {PartnerTreetableService} from '../../../services/partner-treetable-service/partner-treetable.service';
import {PartnerGroupSearchDto} from '../../../api';
import {PartnerSearchService, SearchState} from '../../../services/partner-search.service';
import {PartnerSubnavbar} from '../../basic/partner-subnavbar/partner-subnavbar';

@Component({
  selector: 'partner-partner-search',
  imports: [
    AsyncPipe,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    TranslocoPipe,
    Treetable,
    MfeContent,
    PartnerSubnavbar,
    InfoPanel,
    CypressIdDirective,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './partner-search.html',
  styleUrl: './partner-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerSearch implements OnInit, OnDestroy {
  readonly searchControl = new FormControl<string>('', {nonNullable: true});

  readonly searchPerformed = signal(false);
  readonly hasResults = signal(false);
  readonly examplesVisible = signal(this.loadExamplesVisible());
  readonly activeEngine = signal<'postgres' | 'elasticsearch'>('elasticsearch');
  readonly activeFramework = signal<'spring' | 'quarkus'>('spring');

  partnerTreetableService: PartnerTreetableService | null = null;

  /** Terms to highlight in search results, derived from the backend query summary. */
  readonly highlightTerms = signal<string[]>([]);

  readonly searchExamples = PartnerSearchConfig.SEARCH_EXAMPLES;

  private readonly treetableComponent = viewChild<Treetable<PartnerGroupSearchDto>>(Treetable);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly searchService = inject(PartnerSearchService);
  private readonly translocoService = inject(TranslocoService);
  private readonly partnerConfig = new PartnerSearchConfig(this.translocoService);

  private readonly destroy$ = new Subject<void>();
  private highlightSub?: Subscription;

  constructor() {
    this.wireAutoSearch();
  }

  get partnerDisplayedColumns() {
    return this.partnerConfig.partnerDisplayedColumns;
  }

  get partnerIconConfigs() {
    return this.partnerConfig.partnerIconConfigs;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchControl.setValue(params['q'], {emitEvent: false});
        this.performSearch();
      }
    });
  }

  ngOnDestroy(): void {
    this.highlightSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  async search(): Promise<void> {
    const raw = this.searchControl.value.trim();
    if (raw.length < 3) return;
    this.searchService.updateUrlParam(raw);
    await this.performSearch();
  }

  resetForm(): void {
    this.searchControl.setValue('');
    this.activeEngine.set('elasticsearch');
    this.activeFramework.set('spring');
    this.partnerTreetableService?.switchEngine('elasticsearch');
    this.updateSearchState(this.searchService.resetSearch());
    try { localStorage.removeItem(PartnerSearchConfig.EXAMPLES_COLLAPSED_KEY); } catch { /* ignore */ }
    this.examplesVisible.set(true);
  }

  applyExample(example: SearchExample): void {
    this.searchControl.setValue(example.query);
  }

  toggleExamples(): void {
    this.examplesVisible.update(v => !v);
  }

  createNewPartner(): void {
    const client = this.router.url.split('/')[1];
    this.router.navigate([`/${client}/partner-edit/view`]);
  }

  async onRowClick(node: FlatNode<PartnerGroupSearchDto>): Promise<void> {
    const {data} = node;
    if (data.type === 'P' && data.partnerNumber) {
      const client = this.router.url.split('/')[1];
      this.router.navigate([`/${client}/partner-edit/view`, data.partnerNumber]);
    } else if (data.type === 'V' && this.partnerTreetableService && node.expandable) {
      await this.treetableComponent()?.toggleNode(node);
    }
  }

  async onEngineToggle(useElasticsearch: boolean): Promise<void> {
    const engine = useElasticsearch ? 'elasticsearch' : 'postgres';
    this.partnerTreetableService!.switchEngine(engine);
    this.activeEngine.set(engine);
    await this.treetableComponent()?.reload();
    this.hasResults.set((this.partnerTreetableService?.currentResultCount ?? 0) > 0);
  }

  async onFrameworkToggle(useQuarkus: boolean): Promise<void> {
    const framework = useQuarkus ? 'quarkus' : 'spring';
    this.partnerTreetableService!.switchFramework(framework);
    this.activeFramework.set(framework);
    await this.treetableComponent()?.reload();
    this.hasResults.set((this.partnerTreetableService?.currentResultCount ?? 0) > 0);
  }

  // ── private ────────────────────────────────────────────────────────────

  private wireAutoSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap(value => {
        if (value.trim().length < 3) {
          return from(Promise.resolve(this.searchService.resetSearch()));
        }
        return from(this.searchService.performSearch(value.trim()));
      }),
    ).subscribe(state => {
      if (state.discarded) return;
      this.updateSearchState(state);
      if (state.hasResults) {
        try { localStorage.setItem(PartnerSearchConfig.EXAMPLES_COLLAPSED_KEY, '1'); } catch { /* ignore */ }
        this.examplesVisible.set(false);
      }
    });
  }

  private async performSearch(): Promise<void> {
    const raw = this.searchControl.value.trim();
    if (!raw) return;
    const state = await this.searchService.performSearch(raw);
    if (state.discarded) return;
    this.updateSearchState(state);
  }

  private updateSearchState(state: SearchState): void {
    // If the treetable is already visible (service ref unchanged), ngOnChanges won't
    // fire again — we must explicitly reload so it picks up the new query's results.
    const needsReload = this.partnerTreetableService !== null
      && state.partnerTreetableService !== null
      && state.hasResults;

    this.searchPerformed.set(state.searchPerformed);
    this.hasResults.set(state.hasResults);
    this.partnerTreetableService = state.partnerTreetableService;

    if (needsReload) {
      // Defer reload until after change detection has rendered the @if block containing the
      // Treetable. If this.hasResults was false on the previous call, the Treetable is not
      // yet in the DOM when hasResults.set(true) runs — calling reload() synchronously here
      // would invoke viewChild before the component is mounted.
      setTimeout(() => void this.treetableComponent()?.reload(), 0);
    }

    this.highlightSub?.unsubscribe();
    if (state.partnerTreetableService) {
      this.highlightSub = state.partnerTreetableService.lastQuadResponse.pipe(
        map(() => []),
        takeUntil(this.destroy$),
      ).subscribe(terms => this.highlightTerms.set(terms));
    } else {
      this.highlightTerms.set([]);
    }
  }

  private loadExamplesVisible(): boolean {
    try {
      return !localStorage.getItem(PartnerSearchConfig.EXAMPLES_COLLAPSED_KEY);
    } catch {
      return true;
    }
  }
}
