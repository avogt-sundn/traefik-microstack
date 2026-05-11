import { firmen, carnets, prüfungen, synonyms, multiWordActions } from '../data/ihk-data';
import type { Entity, EntityType, Firma, Carnet, Prüfung, ParsedCommand, Action, ResolvedChip, Suggestion } from '../types';

export function findEntityCandidates(token: string): Array<{ entity: Entity; type: EntityType }> {
  const q = token.toLowerCase();
  if (!q) return [];
  const results: Array<{ entity: Entity; type: EntityType; score: number }> = [];
  for (const firma of firmen) {
    const words = firma.name.toLowerCase().split(/[\s&+]+/);
    if (words.some(w => w.startsWith(q))) {
      results.push({ entity: firma, type: 'firma', score: words[0].startsWith(q) ? 2 : 1 });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.map(({ entity, type }) => ({ entity, type }));
}

const actionsByType: Record<EntityType, Action[]> = {
  firma: [
    { id: 'anrufen', label: 'Anrufen' },
    { id: 'email', label: 'E-Mail senden' },
    { id: 'bearbeiten', label: 'Adresse bearbeiten', needsParameter: 'adresse', requiresDialog: true },
  ],
  carnet: [
    { id: 'genehmigen', label: 'Freigeben' },
    { id: 'stornieren', label: 'Stornieren' },
    { id: 'limit', label: 'Limit ändern', needsParameter: 'limit' },
    { id: 'verschieben', label: 'Inhaber wechseln', needsParameter: 'firma' },
  ],
  prüfung: [
    { id: 'genehmigen', label: 'Genehmigen' },
    { id: 'status', label: 'Status einsehen' },
    { id: 'termin', label: 'Termin verschieben', needsParameter: 'termin' },
  ],
};

function normalizeActionToken(token: string): string | null {
  const lower = token.toLowerCase();
  for (const [canonical, syns] of Object.entries(synonyms)) {
    if (lower === canonical || syns.includes(lower)) return canonical;
  }
  return null;
}

function findMultiWordAction(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [phrase, canonical] of Object.entries(multiWordActions)) {
    if (lower.includes(phrase)) return canonical;
  }
  return null;
}

function findPartialActionMatches(query: string, availableActions: Action[]): Action[] {
  const q = query.toLowerCase().trim();
  if (!q) return availableActions;
  return availableActions.filter(a => {
    if (a.id.startsWith(q)) return true;
    if (a.label.toLowerCase().split(/\s+/).some(w => w.startsWith(q))) return true;
    for (const [phrase, canonical] of Object.entries(multiWordActions)) {
      if (canonical === a.id && phrase.split(/\s+/).some(w => w.startsWith(q))) return true;
    }
    return false;
  });
}

export function getActionInputToken(action: Action): string {
  for (const [phrase, canonical] of Object.entries(multiWordActions)) {
    if (canonical === action.id) return phrase;
  }
  return action.id;
}

function findCarnetDirect(tokens: string[]): { entity: Carnet; type: 'carnet' } | null {
  const query = tokens.join(' ').toLowerCase();
  for (const carnet of carnets) {
    const numClean = carnet.nummer.toLowerCase().replace(/[#-]/g, '');
    const queryClean = query.replace(/\s+/g, '');
    if (numClean.includes(queryClean)) return { entity: carnet, type: 'carnet' };
  }
  for (const carnet of carnets) {
    const firma = firmen.find(f => f.id === carnet.inhaberId);
    if (firma && firma.name.toLowerCase().includes(query)) return { entity: carnet, type: 'carnet' };
  }
  return null;
}

function findEntity(tokens: string[]): { entity: Entity; type: EntityType } | null {
  if (tokens[0]?.toLowerCase() === 'carnet' && tokens.length > 1) {
    return findCarnetDirect(tokens.slice(1));
  }
  if (tokens[0]?.toLowerCase() === 'prüfung' && tokens.length > 1) {
    const query = tokens.slice(1).join(' ').toLowerCase();
    for (const p of prüfungen) {
      const numClean = p.nummer.toLowerCase().replace(/[#-]/g, '');
      if (numClean.includes(query.replace(/\s+/g, '')) || p.nummer.toLowerCase().includes(query)) {
        return { entity: p, type: 'prüfung' };
      }
    }
  }
  const query = tokens.join(' ').toLowerCase();
  for (const firma of firmen) {
    if (firma.name.toLowerCase().includes(query) || tokens.some(t => firma.name.toLowerCase().includes(t.toLowerCase()))) {
      return { entity: firma, type: 'firma' };
    }
  }
  for (const carnet of carnets) {
    const numClean = carnet.nummer.toLowerCase().replace(/[#-]/g, '');
    const queryClean = query.replace(/\s+/g, '');
    if (numClean.includes(queryClean) || carnet.nummer.toLowerCase().includes(query)) {
      return { entity: carnet, type: 'carnet' };
    }
  }
  for (const p of prüfungen) {
    const numClean = p.nummer.toLowerCase().replace(/[#-]/g, '');
    const queryClean = query.replace(/\s+/g, '');
    if (numClean.includes(queryClean) || p.nummer.toLowerCase().includes(query)) {
      return { entity: p, type: 'prüfung' };
    }
  }
  return null;
}

export function getEntityDisplayName(entity: Entity, type: EntityType): string {
  if (type === 'firma') return (entity as Firma).name;
  if (type === 'carnet') return (entity as Carnet).nummer;
  if (type === 'prüfung') return (entity as Prüfung).nummer;
  return '';
}

export function getEntityDetails(entity: Entity, type: EntityType): string {
  if (type === 'firma') return (entity as Firma).kammer;
  if (type === 'carnet') {
    const carnet = entity as Carnet;
    const firma = firmen.find(f => f.id === carnet.inhaberId);
    return firma ? firma.name : '';
  }
  if (type === 'prüfung') {
    const p = entity as Prüfung;
    const firma = firmen.find(f => f.id === p.firmaId);
    return firma ? firma.name : '';
  }
  return '';
}

export function getEntityColor(type: EntityType): string {
  if (type === 'carnet') return '#0050a0';
  if (type === 'firma') return '#00897b';
  if (type === 'prüfung') return '#7cb342';
  return '#9e9e9e';
}

export function getEntityTypeBadge(type: EntityType): string {
  if (type === 'carnet') return 'Carnet';
  if (type === 'firma') return 'Firma';
  if (type === 'prüfung') return 'Prüfung';
  return '';
}

function generateParameterSuggestions(action: Action, entity?: Entity): Suggestion[] {
  if (action.needsParameter === 'firma') {
    return firmen
      .filter(f => f.id !== (entity as any)?.inhaberId)
      .slice(0, 3)
      .map(f => ({ type: 'parameter' as const, label: f.name, value: f, metadata: `${f.kammer}, aktiv` }));
  }
  return [];
}

function extractParameter(tokens: string[], action: Action, entity?: Entity): any {
  if (action.needsParameter === 'firma') {
    for (const firma of firmen) {
      if (firma.id !== (entity as any)?.inhaberId && tokens.some(t => firma.name.toLowerCase().includes(t.toLowerCase()))) {
        return firma;
      }
    }
  }
  if (action.needsParameter === 'limit') {
    const numToken = tokens.find(t => /^\d+$/.test(t));
    if (numToken) return parseInt(numToken);
  }
  return null;
}

export function parseCommand(
  input: string,
  confirmedEntity?: { entity: Entity; type: EntityType },
  confirmedAction?: Action,
): ParsedCommand {
  // Confirmed entity with no further input → show entity_only immediately
  if (!input.trim() && confirmedEntity) {
    const chips: ResolvedChip[] = [{
      id: 'entity', type: 'entity',
      label: getEntityDisplayName(confirmedEntity.entity, confirmedEntity.type),
      value: { entity: confirmedEntity.entity, type: confirmedEntity.type },
      color: getEntityColor(confirmedEntity.type),
      removable: true,
    }];
    const suggestions = actionsByType[confirmedEntity.type].map(a => ({
      type: 'action' as const, label: a.label, value: a,
    }));
    const inhaberFirma = confirmedEntity.type === 'carnet'
      ? firmen.find(f => f.id === (confirmedEntity.entity as Carnet).inhaberId)
      : undefined;
    return { state: 'entity_only', entity: confirmedEntity.entity, entityType: confirmedEntity.type, chips, suggestions, inhaberFirma };
  }

  // Confirmed action: entity+action chips locked, input is parameter tokens
  if (confirmedEntity && confirmedAction) {
    const chips: ResolvedChip[] = [
      {
        id: 'entity', type: 'entity',
        label: getEntityDisplayName(confirmedEntity.entity, confirmedEntity.type),
        value: { entity: confirmedEntity.entity, type: confirmedEntity.type },
        color: getEntityColor(confirmedEntity.type),
        removable: true,
      },
      {
        id: 'action', type: 'action',
        label: `✓ ${confirmedAction.label}`, value: confirmedAction,
        color: '#e8f5e9', removable: true,
      },
    ];

    if (!confirmedAction.needsParameter) {
      return { state: 'action_pending', entity: confirmedEntity.entity, entityType: confirmedEntity.type, action: confirmedAction, chips, suggestions: [] };
    }

    const paramTokens = input.trim().split(/\s+/).filter(Boolean);
    const parameter = paramTokens.length > 0 ? extractParameter(paramTokens, confirmedAction, confirmedEntity.entity) : null;

    if (parameter !== null && parameter !== undefined) {
      const paramLabel = typeof parameter === 'object' && 'name' in parameter
        ? parameter.name
        : parameter.toLocaleString('de-DE') + ' €';
      chips.push({ id: 'param', type: 'parameter', label: `✓ ${paramLabel}`, value: parameter, color: '#e8f5e9', removable: true });
      return { state: 'ready', entity: confirmedEntity.entity, entityType: confirmedEntity.type, action: confirmedAction, parameter, chips, suggestions: [] };
    }

    return {
      state: 'parameter_pending', entity: confirmedEntity.entity, entityType: confirmedEntity.type,
      action: confirmedAction, chips, suggestions: generateParameterSuggestions(confirmedAction, confirmedEntity.entity),
    };
  }

  if (!input.trim()) {
    return { state: 'empty', chips: [], suggestions: [] };
  }

  const tokens = input.trim().split(/\s+/).filter(t => t.length > 0);

  // 1. Resolve entity — only from confirmedEntity or multi-keyword paths
  let entity: Entity | undefined;
  let entityType: EntityType | undefined;
  let entityTokenCount = 0;

  if (confirmedEntity) {
    // Entity already locked — entire input is action/parameter tokens
    entity = confirmedEntity.entity;
    entityType = confirmedEntity.type;
    entityTokenCount = 0;
  } else {
    // Only resolve automatically when the first token is a structural keyword
    // (carnet/prüfung direct path) or the full name is typed — never on a single
    // partial word like "g".
    const firstToken = tokens[0]?.toLowerCase();
    if (firstToken === 'carnet' && tokens.length > 1) {
      const result = findCarnetDirect(tokens.slice(1));
      if (result) { entity = result.entity; entityType = result.type; entityTokenCount = tokens.length; }
    } else if (firstToken === 'prüfung' && tokens.length > 1) {
      const query = tokens.slice(1).join(' ').toLowerCase();
      for (const p of prüfungen) {
        const numClean = p.nummer.toLowerCase().replace(/[#-]/g, '');
        if (numClean.includes(query.replace(/\s+/g, '')) || p.nummer.toLowerCase().includes(query)) {
          entity = p; entityType = 'prüfung'; entityTokenCount = tokens.length; break;
        }
      }
    } else {
      // For plain text: only resolve if there is more than one token so typing a
      // single partial word never immediately locks an entity.
      if (tokens.length > 1) {
        for (let n = tokens.length; n >= 1; n--) {
          const result = findEntity(tokens.slice(0, n));
          if (result) { entity = result.entity; entityType = result.type; entityTokenCount = n; break; }
        }
      }
    }
  }

  if (!entity || !entityType) {
    return { state: 'empty', chips: [], suggestions: [] };
  }

  const chips: ResolvedChip[] = [{
    id: 'entity',
    type: 'entity',
    label: getEntityDisplayName(entity, entityType),
    value: { entity, type: entityType },
    color: getEntityColor(entityType),
    removable: true,
  }];

  const remainingTokens = tokens.slice(entityTokenCount);
  const remainingText = remainingTokens.join(' ');

  if (remainingTokens.length === 0) {
    const suggestions: Suggestion[] = actionsByType[entityType].map(a => ({
      type: 'action' as const, label: a.label, value: a,
    }));
    const inhaberFirma = entityType === 'carnet'
      ? firmen.find(f => f.id === (entity as Carnet).inhaberId)
      : undefined;
    return { state: 'entity_only', entity, entityType, chips, suggestions, inhaberFirma };
  }

  // 2. Resolve action
  const availableActions = actionsByType[entityType];
  let action: Action | undefined;
  let actionTokenCount = 0;

  const multiWord = findMultiWordAction(remainingText);
  if (multiWord) {
    action = availableActions.find(a => a.id === multiWord);
    if (action) {
      const phrase = Object.entries(multiWordActions).find(([, v]) => v === multiWord)?.[0] ?? '';
      actionTokenCount = phrase.split(' ').length;
    }
  }

  if (!action) {
    for (let i = 0; i < remainingTokens.length; i++) {
      const normalized = normalizeActionToken(remainingTokens[i]);
      if (normalized) {
        action = availableActions.find(a => a.id === normalized);
        if (action) { actionTokenCount = i + 1; break; }
      }
    }
  }

  if (!action) {
    // Show filtered suggestions based on what's been typed so far
    const partialMatches = findPartialActionMatches(remainingText, availableActions);
    const suggestions: Suggestion[] = partialMatches.map(a => ({
      type: 'action' as const, label: a.label, value: a,
    }));
    const inhaberFirma = entityType === 'carnet'
      ? firmen.find(f => f.id === (entity as Carnet).inhaberId)
      : undefined;
    return { state: 'entity_only', entity, entityType, chips, suggestions, inhaberFirma, actionQuery: remainingText };
  }

  chips.push({
    id: 'action', type: 'action',
    label: `✓ ${action.label}`, value: action,
    color: '#e8f5e9', removable: true,
  });

  if (!action.needsParameter) {
    return { state: 'action_pending', entity, entityType, action, chips, suggestions: [] };
  }

  // 3. Resolve parameter
  const paramTokens = tokens.slice(entityTokenCount + actionTokenCount);
  const parameter = paramTokens.length > 0 ? extractParameter(paramTokens, action, entity) : null;

  if (parameter !== null && parameter !== undefined) {
    const paramLabel = typeof parameter === 'object' && 'name' in parameter
      ? parameter.name
      : parameter.toLocaleString('de-DE') + ' €';
    chips.push({
      id: 'param', type: 'parameter',
      label: `✓ ${paramLabel}`, value: parameter,
      color: '#e8f5e9', removable: true,
    });
    return { state: 'ready', entity, entityType, action, parameter, chips, suggestions: [] };
  }

  return {
    state: 'parameter_pending', entity, entityType, action, chips,
    suggestions: generateParameterSuggestions(action, entity),
  };
}
