import { PartnerGroupSearchDto } from './partner-group-search-dto';

export interface SearchEngineResult {
  results: Array<PartnerGroupSearchDto>;
  totalCount: number;
  returnedCount: number;
  durationMs: number;
}

export interface QuerySummary {
  tokens: string[];
}

export interface DualSearchResponse {
  postgres: SearchEngineResult;
  elasticsearch: SearchEngineResult;
  query: QuerySummary;
}

export interface QuadSearchResponse {
  spring: { postgres: SearchEngineResult | null; elasticsearch: SearchEngineResult | null };
  quarkus: { postgres: SearchEngineResult | null; elasticsearch: SearchEngineResult | null };
  quarkusAvailable: boolean;
}
