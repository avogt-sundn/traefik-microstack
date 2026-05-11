import {
  firmen,
  carnets,
  prüfungen,
  synonyms,
  multiWordActions,
} from '../data/ihk-data';
import type {
  Entity,
  EntityType,
  Firma,
  Carnet,
  Prüfung,
  ParsedCommand,
  Action,
  ResolvedChip,
  Suggestion,
} from '../types/ihk';

// Actions available per entity type
const actionsByType: Record<EntityType, Action[]> = {
  firma: [
    { id: 'anrufen', label: 'Anrufen' },
    { id: 'email', label: 'E-Mail senden' },
    { id: 'bearbeiten', label: 'Adresse bearbeiten', needsParameter: 'adresse', requiresDialog: true },
  ],
  carnet: [
    { id: 'freigeben', label: 'Freigeben' },
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

// Direct Carnet lookup by partial number or Inhaber name
function findCarnetDirect(tokens: string[]): { entity: Carnet; type: 'carnet' } | null {
  const query = tokens.join(' ').toLowerCase();
  for (const carnet of carnets) {
    const numClean = carnet.nummer.toLowerCase().replace(/[#-]/g, '');
    const queryClean = query.replace(/\s+/g, '');
    if (numClean.includes(queryClean)) return { entity: carnet, type: 'carnet' };
  }
  for (const carnet of carnets) {
    const firma = firmen.find((f) => f.id === carnet.inhaberId);
    if (firma && firma.name.toLowerCase().includes(query)) return { entity: carnet, type: 'carnet' };
  }
  return null;
}

function findEntity(tokens: string[]): { entity: Entity; type: EntityType } | null {
  // Direct carnet lookup: `carnet <token>`
  if (tokens[0]?.toLowerCase() === 'carnet' && tokens.length > 1) {
    return findCarnetDirect(tokens.slice(1));
  }
  const query = tokens.join(' ').toLowerCase();
  for (const firma of firmen) {
    if (firma.name.toLowerCase().includes(query) || tokens.some((t) => firma.name.toLowerCase().includes(t.toLowerCase()))) {
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
  for (const prüfung of prüfungen) {
    const numClean = prüfung.nummer.toLowerCase().replace(/[#-]/g, '');
    const queryClean = query.replace(/\s+/g, '');
    if (numClean.includes(queryClean) || prüfung.nummer.toLowerCase().includes(query)) {
      return { entity: prüfung, type: 'prüfung' };
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
    const firma = firmen.find((f) => f.id === carnet.inhaberId);
    return firma ? firma.name : '';
  }
  if (type === 'prüfung') {
    const prüfung = entity as Prüfung;
    const firma = firmen.find((f) => f.id === prüfung.firmaId);
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

function generateParameterSuggestions(
  action: Action,
  entity?: Entity,
): Suggestion[] {
  if (action.needsParameter === 'firma') {
    return firmen
      .filter((f) => f.id !== (entity as any)?.inhaberId)
      .slice(0, 3)
      .map((f) => ({
        type: 'parameter' as const,
        label: f.name,
        value: f,
        metadata: `${f.kammer}, aktiv`,
      }));
  }
  return [];
}

function extractParameter(tokens: string[], action: Action, entity?: Entity): any {
  if (action.needsParameter === 'firma') {
    for (const firma of firmen) {
      if (
        firma.id !== (entity as any)?.inhaberId &&
        tokens.some((t) => firma.name.toLowerCase().includes(t.toLowerCase()))
      ) {
        return firma;
      }
    }
  }
  if (action.needsParameter === 'limit') {
    const numToken = tokens.find((t) => /^\d+$/.test(t));
    if (numToken) return parseInt(numToken);
  }
  return null;
}

/**
 * Single-pass parser: resolves entity → action → parameter from the full input string.
 * Does NOT require chip locking — chips are computed as a result, not an input.
 * lockedChips are still accepted for compatibility but the parser works without them.
 *
 * Token evaluation order:
 *   Firma → related entity → action → parameter
 *
 * Special prefix: `carnet <X>` → direct Carnet lookup by number or Inhaber name
 */
export function parseCommand(input: string, lockedChips: ResolvedChip[] = []): ParsedCommand {
  if (!input.trim() && lockedChips.length === 0) {
    return { state: 'empty', chips: [], suggestions: [] };
  }

  const tokens = input.trim().split(/\s+/).filter((t) => t.length > 0);
  const fullText = tokens.join(' ');

  // ── 1. Resolve entity ──────────────────────────────────────────────────────

  let entity: Entity | undefined;
  let entityType: EntityType | undefined;
  let entityTokenCount = 0;

  // Check locked entity chip first
  const entityChip = lockedChips.find((c) => c.type === 'entity');
  if (entityChip) {
    entity = entityChip.value.entity;
    entityType = entityChip.value.type;
  }

  if (!entity) {
    // Try progressively longer token sequences to find entity
    for (let n = tokens.length; n >= 1; n--) {
      const result = findEntity(tokens.slice(0, n));
      if (result) {
        entity = result.entity;
        entityType = result.type;
        entityTokenCount = n;
        break;
      }
    }
  }

  if (!entity || !entityType) {
    return { state: 'empty', chips: [], suggestions: [] };
  }

  // Build entity chip for display
  const chips: ResolvedChip[] = [
    {
      id: 'entity',
      type: 'entity',
      label: getEntityDisplayName(entity, entityType),
      value: { entity, type: entityType },
      color: getEntityColor(entityType),
      removable: true,
    },
  ];

  // Tokens remaining after entity was consumed
  const remainingTokens = entityChip ? tokens : tokens.slice(entityTokenCount);
  const remainingText = remainingTokens.join(' ');

  // If nothing remains → entity_only with action suggestions
  if (remainingTokens.length === 0) {
    const suggestions: Suggestion[] = actionsByType[entityType].map((a) => ({
      type: 'action' as const,
      label: a.label,
      value: a,
    }));
    // Also suggest Inhaber (State E2 style) for carnets
    if (entityType === 'carnet') {
      const carnet = entity as Carnet;
      const inhaber = firmen.find((f) => f.id === carnet.inhaberId);
      return {
        state: 'entity_only',
        entity,
        entityType,
        chips,
        suggestions,
        inhaberFirma: inhaber,
      } as any;
    }
    return { state: 'entity_only', entity, entityType, chips, suggestions };
  }

  // ── 2. Resolve action ──────────────────────────────────────────────────────

  const availableActions = actionsByType[entityType];
  let action: Action | undefined;
  let actionTokenCount = 0;

  // Try multi-word action first (highest specificity)
  const multiWord = findMultiWordAction(remainingText);
  if (multiWord) {
    action = availableActions.find((a) => a.id === multiWord);
    if (action) {
      // Count how many tokens the multi-word phrase consumes
      const phrase = Object.entries(multiWordActions).find(([, v]) => v === multiWord)?.[0] ?? '';
      actionTokenCount = phrase.split(' ').length;
    }
  }

  // Fall back to single-token action
  if (!action) {
    for (let i = 0; i < remainingTokens.length; i++) {
      const normalized = normalizeActionToken(remainingTokens[i]);
      if (normalized) {
        action = availableActions.find((a) => a.id === normalized);
        if (action) {
          actionTokenCount = i + 1;
          break;
        }
      }
    }
  }

  if (!action) {
    // Input has text after entity but no action matched → show action suggestions
    const suggestions: Suggestion[] = availableActions.map((a) => ({
      type: 'action' as const,
      label: a.label,
      value: a,
    }));
    if (entityType === 'carnet') {
      const carnet = entity as Carnet;
      const inhaber = firmen.find((f) => f.id === carnet.inhaberId);
      return {
        state: 'entity_only',
        entity,
        entityType,
        chips,
        suggestions,
        inhaberFirma: inhaber,
      } as any;
    }
    return { state: 'entity_only', entity, entityType, chips, suggestions };
  }

  // Build action chip
  chips.push({
    id: 'action',
    type: 'action',
    label: `✓ ${action.label}`,
    value: action,
    color: '#e8f5e9',
    removable: true,
  });

  // If action needs no parameter → ready
  if (!action.needsParameter) {
    return { state: 'action_pending', entity, entityType, action, chips };
  }

  // ── 3. Resolve parameter ───────────────────────────────────────────────────

  const paramTokens = entityChip
    ? tokens
    : tokens.slice(entityTokenCount + actionTokenCount);

  const parameter = paramTokens.length > 0
    ? extractParameter(paramTokens, action, entity)
    : null;

  if (parameter !== null && parameter !== undefined) {
    // Build parameter chip
    const paramLabel =
      typeof parameter === 'object' && 'name' in parameter
        ? parameter.name
        : parameter.toLocaleString('de-DE') + ' €';
    chips.push({
      id: 'param',
      type: 'parameter',
      label: `✓ ${paramLabel}`,
      value: parameter,
      color: '#e8f5e9',
      removable: true,
    });
    return { state: 'ready', entity, entityType, action, parameter, chips };
  }

  // Parameter expected but not yet resolved
  return {
    state: 'parameter_pending',
    entity,
    entityType,
    action,
    chips,
    suggestions: generateParameterSuggestions(action, entity),
  };
}
