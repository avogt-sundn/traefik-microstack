export type EntityType = 'firma' | 'carnet' | 'prüfung';

export interface Firma {
  id: string;
  name: string;
  kammer: string;
  ansprechpartner: string;
  telefon: string;
}

export interface Carnet {
  id: string;
  nummer: string;
  inhaberId: string;
  limit: number;
  status: string;
}

export interface Prüfung {
  id: string;
  nummer: string;
  firmaId: string;
  termin: string;
  status: string;
}

export type Entity = Firma | Carnet | Prüfung;

export interface Action {
  id: string;
  label: string;
  needsParameter?: string;
  requiresDialog?: boolean;
}

export interface ResolvedChip {
  id: string;
  type: 'entity' | 'action' | 'parameter';
  label: string;
  value: any;
  color: string;
  removable: boolean;
}

export interface Suggestion {
  type: 'action' | 'parameter';
  label: string;
  value: any;
  metadata?: string;
}

export interface ParsedCommand {
  state: 'empty' | 'entity_only' | 'action_pending' | 'parameter_pending' | 'ready';
  entity?: Entity;
  entityType?: EntityType;
  action?: Action;
  parameter?: any;
  chips: ResolvedChip[];
  suggestions: Suggestion[];
  inhaberFirma?: Firma;
  actionQuery?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  timestamp: string;
  user: string;
  entityType: EntityType;
  entityId: string;
  action: string;
  details: string;
  commandTokens: string;
  source?: 'own' | 'colleague' | 'system';
  transactionId?: string;
}

export interface Transaction {
  id: string;
  number: string;
  status: 'entwurf' | 'zur prüfung';
  author: string;
  steps: TransactionStep[];
  createdAt: string;
  submittedAt?: string;
}

export interface TransactionStep {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: string;
  details: string;
  commandTokens: string;
}

export interface OffenerVorgang {
  id: string;
  entityType: EntityType;
  entityId: string;
  title: string;
  clerk: string;
}
