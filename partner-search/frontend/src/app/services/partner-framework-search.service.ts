import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { SearchEngineResult, QuadSearchResponse } from '../api/model/dual-search-response';

@Injectable({ providedIn: 'root' })
export class PartnerFrameworkSearchService {
  private http = inject(HttpClient);

  search(rawQuery: string): Observable<QuadSearchResponse> {
    const params: Record<string, string> = rawQuery?.trim() ? { q: rawQuery.trim() } : {};
    const springPg$    = this.http.get<SearchEngineResult>('/api/partner/spring/search/postgres',       { params }).pipe(startWith(null));
    const springEs$    = this.http.get<SearchEngineResult>('/api/partner/spring/search/elasticsearch',  { params }).pipe(startWith(null));
    const quarkusPg$   = this.http.get<SearchEngineResult>('/api/partner/quarkus/search/postgres',      { params }).pipe(catchError(() => of(null)), startWith(null));
    const quarkusEs$   = this.http.get<SearchEngineResult>('/api/partner/quarkus/search/elasticsearch', { params }).pipe(catchError(() => of(null)), startWith(null));

    return combineLatest([springPg$, springEs$, quarkusPg$, quarkusEs$]).pipe(
      map(([springPg, springEs, quarkusPg, quarkusEs]) => ({
        spring: { postgres: springPg, elasticsearch: springEs },
        quarkus: { postgres: quarkusPg, elasticsearch: quarkusEs },
        quarkusAvailable: quarkusPg !== null || quarkusEs !== null,
      }))
    );
  }
}
