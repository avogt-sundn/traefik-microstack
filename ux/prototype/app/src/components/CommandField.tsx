import { useState, useRef, useEffect } from 'preact/hooks';
import { parseCommand, findEntityCandidates, getEntityDisplayName, getEntityDetails, getEntityColor, getEntityTypeBadge, getActionInputToken } from '../utils/command-parser';
import { firmen, carnets, prüfungen } from '../data/ihk-data';
import type { ParsedCommand, EntityType, Firma, Carnet, Entity, Action } from '../types';

const EXAMPLES = [
  'günther carnet limit 45000',
  'becker adresse',
  'prüfung p-012 genehmigen',
  'carnet günther inhaber wechseln',
  'müller email',
];

// Warenpositionen seed data for State G (table)
const WARENPOSITIONEN = [
  { pos: 1, beschreibung: 'Fräsmaschine CNC-400', menge: 2, einzelwert: 22500, zollNr: '8459.61' },
  { pos: 2, beschreibung: 'Drehmaschine TL-200', menge: 1, einzelwert: 28000, zollNr: '8458.11' },
  { pos: 3, beschreibung: 'Messgerät Typ-B', menge: 4, einzelwert: 1250, zollNr: '9031.80' },
];

const TOTAL_WERT = WARENPOSITIONEN.reduce((sum, wp) => sum + wp.menge * wp.einzelwert, 0);

interface Props {
  onExecute: (parsed: ParsedCommand) => void;
  recalledCommand?: string;
  transactionId?: string;
}

export function CommandField({ onExecute, recalledCommand, transactionId }: Props) {
  const [input, setInput] = useState('');
  const [confirmedEntity, setConfirmedEntity] = useState<{ entity: Entity; type: EntityType } | null>(null);
  const [confirmedAction, setConfirmedAction] = useState<Action | null>(null);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState(0);
  const [selectedActionIdx, setSelectedActionIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (recalledCommand) {
      setInput(recalledCommand);
      setConfirmedEntity(null);
      setConfirmedAction(null);
      inputRef.current?.focus();
    }
  }, [recalledCommand]);

  // Compute candidates only when no entity is confirmed yet and input is a single partial token
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const isPartialFirstToken = !confirmedEntity && tokens.length === 1 && input.trim() === tokens[0];
  const candidates = isPartialFirstToken ? findEntityCandidates(tokens[0]) : [];

  // Reset candidate/action selection when lists change
  useEffect(() => { setSelectedCandidateIdx(0); }, [candidates.length, tokens[0]]);

  // Auto-confirm single entity candidate after short debounce (feels like resolution, not a jump)
  useEffect(() => {
    if (candidates.length !== 1) return;
    const t = setTimeout(() => {
      setConfirmedEntity(candidates[0]);
      setInput('');
    }, 200);
    return () => clearTimeout(t);
  }, [candidates.length === 1 ? (candidates[0].entity as any).id : null]);

  const parsed = parseCommand(input, confirmedEntity ?? undefined, confirmedAction ?? undefined);

  // Derive panel state from parsed.action — never from raw input strings
  const isProgressiveForm = parsed.action?.id === 'neu-anlegen'
    || input.toLowerCase().includes('firma neu anlegen');
  const isWarenPositionen = parsed.action?.id === 'warenpositionen'
    || input.toLowerCase().includes('warenpositionen');
  const isMiniForm = parsed.action?.id === 'bearbeiten' && parsed.entityType === 'firma';
  const isInlineField = parsed.action?.id === 'limit' && parsed.entityType === 'carnet'
    && parsed.state !== 'ready';

  // Action suggestions shown while entity is confirmed but action not yet resolved
  const showActionSuggestions = parsed.state === 'entity_only' && parsed.suggestions.length > 0;
  useEffect(() => { setSelectedActionIdx(0); }, [parsed.suggestions.length, parsed.actionQuery]);

  // Auto-confirm single action match when user has typed a partial action token
  useEffect(() => {
    if (!parsed.actionQuery) return;
    if (parsed.suggestions.length !== 1) return;
    const action = parsed.suggestions[0].value as Action;
    const t = setTimeout(() => {
      setConfirmedAction(action);
      setInput('');
    }, 200);
    return () => clearTimeout(t);
  }, [parsed.suggestions.length === 1 && parsed.actionQuery ? parsed.suggestions[0]?.value?.id : null]);

  const selectAction = (idx: number) => {
    const suggestion = parsed.suggestions[idx];
    if (!suggestion) return;
    const action = suggestion.value as Action;
    setConfirmedAction(action);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Navigate entity candidates list
    if (candidates.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setSelectedCandidateIdx(i =>
        e.key === 'ArrowDown'
          ? Math.min(i + 1, candidates.length - 1)
          : Math.max(i - 1, 0)
      );
      return;
    }

    // Navigate action suggestions list
    if (showActionSuggestions && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setSelectedActionIdx(i =>
        e.key === 'ArrowDown'
          ? Math.min(i + 1, parsed.suggestions.length - 1)
          : Math.max(i - 1, 0)
      );
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      // Confirm top (or selected) entity candidate
      if (candidates.length > 0) {
        const chosen = candidates[selectedCandidateIdx];
        setConfirmedEntity(chosen);
        setInput('');
        return;
      }

      // Confirm top (or selected) action suggestion when only one or navigated
      if (showActionSuggestions && parsed.suggestions.length === 1) {
        selectAction(0);
        return;
      }
      if (showActionSuggestions && parsed.actionQuery && parsed.suggestions.length > 0) {
        selectAction(selectedActionIdx);
        return;
      }

      if (parsed.state === 'ready' || parsed.state === 'action_pending') {
        onExecute(parsed);
        setInput('');
        setConfirmedEntity(null);
        setConfirmedAction(null);
      } else if (isProgressiveForm) {
        // Progressive form: TAB advances to next section, ENTER executes on last section
        if (input.toLowerCase().includes('ansprechpartner') || input.toLowerCase().includes('telefon')) {
          onExecute(parsed);
          setInput('');
        } else {
          // Advance to next section (simulate)
          const sections = ['firmenname', 'adresse', 'ansprechpartner'];
          let currentSection = 0;
          for (let i = 0; i < sections.length; i++) {
            if (input.toLowerCase().includes(sections[i])) {
              currentSection = i;
              break;
            }
          }
          if (currentSection < sections.length - 1) {
            // Simulate advancing to next section by filling relevant field
            const nextSection = sections[currentSection + 1];
            if (nextSection === 'adresse') {
              setInput('firma neu anlegen musterstraße 14');
            } else if (nextSection === 'ansprechpartner') {
              setInput('firma neu anlegen r. günther +49 241 8800-0');
            }
          } else {
            onExecute(parsed);
            setInput('');
          }
        }
      } else if (isWarenPositionen) {
        onExecute(parsed);
        setInput('');
      } else if (isMiniForm) {
        onExecute(parsed);
        setInput('');
      } else if (isInlineField) {
        onExecute(parsed);
        setInput('');
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setInput('');
      setConfirmedEntity(null);
      setConfirmedAction(null);
    }
  };

  const removeChip = (chipId: string) => {
    const idx = parsed.chips.findIndex(c => c.id === chipId);
    if (idx === 0) {
      setInput('');
      setConfirmedEntity(null);
      setConfirmedAction(null);
      return;
    }
    if (idx === 1) {
      // Remove action chip: keep entity confirmed, reset action
      setInput('');
      setConfirmedAction(null);
      return;
    }
    if (idx === 2) {
      // Remove parameter chip: keep entity + action locked, clear param input
      setInput('');
    }
  };

  const isResetHint = !!recalledCommand && input === recalledCommand;

  // Count executed commands for reset hint dependent actions
  const executedCommands = input.trim().toLowerCase();

  return (
    <div class="command-zone">
      {/* Command field container */}
      <div class="command-field">
        <div class="command-field__row1">
          {/* TX chip */}
          {transactionId && <span class="tx-chip">TX</span>}

          {/* Inline chips */}
          {parsed.chips.map(chip => (
            <span
              key={chip.id}
              class={`inline-chip ${chip.type === 'entity' ? 'inline-chip--entity' : 'inline-chip--action'}`}
              style={chip.type === 'entity' ? { background: chip.color } : undefined}
              onClick={() => removeChip(chip.id)}
            >
              {chip.label}
              <span class="chip-remove">&times;</span>
            </span>
          ))}

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            placeholder={parsed.chips.length === 0 ? 'Entität oder Befehl eingeben…' : ''}
            autoFocus
          />
        </div>

        {/* Beispiele strip (when fully empty) */}
        {parsed.state === 'empty' && !candidates.length && (
          <div class="command-field__beispiele">
            <span class="beispiele-label">Beispiele:</span>
            {EXAMPLES.map(ex => (
              <span key={ex} class="beispiel-chip" onClick={() => setInput(ex)}>{ex}</span>
            ))}
          </div>
        )}
      </div>

      {/* Candidate list — partial first token, not yet confirmed */}
      {candidates.length > 0 && (
        <div class="candidates-panel">
          {candidates.map((c, i) => (
            <div
              key={(c.entity as any).id}
              class={`candidate-row${i === selectedCandidateIdx ? ' candidate-row--active' : ''}`}
              onClick={() => { setConfirmedEntity(c); setInput(''); }}
            >
              <span class="candidate-badge" style={{ background: getEntityColor(c.type) }}>
                {getEntityTypeBadge(c.type)}
              </span>
              <span class="candidate-name">{getEntityDisplayName(c.entity, c.type)}</span>
              <span class="candidate-detail">{getEntityDetails(c.entity, c.type)}</span>
              {i === 0 && <span class="candidate-hint">ENTER</span>}
            </div>
          ))}
        </div>
      )}

      {/* Preview / action panels */}
      {candidates.length === 0 && parsed.state !== 'empty' && (
        <div class="preview-panel">
          {/* Reset hint (F-13) */}
          {isResetHint && (
            <div class="reset-hint">
              <div class="reset-hint__header">
                <span style={{ color: 'var(--warning)' }}>⚠</span>
                <span>Zurücksetzen auf {parsed.entity ? getEntityDisplayName(parsed.entity, parsed.entityType!) : ''} — ENTER macht diese Aktion und alle abhängigen Folgeaktionen rückgängig.</span>
              </div>
              <div class="reset-hint__dependent">
                <span style={{ color: 'var(--text-error)' }}>Rückgängig: 1 abhängige Aktion (Inhaber wechseln, 10:15)</span>
              </div>
              <div class="reset-hint__independent">
                <span style={{ color: '#2e7d32' }}>Erhalten: 2 unabhängige Aktionen (becker adresse, prüfung p-012)</span>
              </div>
              <div class="reset-hint__keys">
                <kbd>ENTER Zurücksetzen + neu ausführen</kbd>
                <kbd>ESC Abbrechen</kbd>
              </div>
            </div>
          )}

          {/* Progressive form (State F1-F3) */}
          {isProgressiveForm && (
            <div class="progressive-form">
              <div class="progressive-form__header">
                Neue Firma anlegen
                <span class="section-counter">1 / 3</span>
              </div>

              {/* Section 1: Firmendaten */}
              {!input.toLowerCase().includes('straße') && !input.toLowerCase().includes('ansprechpartner') && (
                <div class="form-section">
                  <label class="field-label">Firmenname *</label>
                  <input class="lux-input" placeholder="Musterfirma GmbH" />
                  <label class="field-label">Rechtsform *</label>
                  <select class="lux-input"><option>GmbH</option><option>KG</option><option>AG</option></select>
                  <label class="field-label">Kammerbezirk *</label>
                  <select class="lux-input"><option>Aachen</option><option>München</option></select>
                  <div class="form-hint">TAB → nächster Abschnitt · ESC Abbrechen</div>
                </div>
              )}

              {/* Section 2: Adresse */}
              {input.toLowerCase().includes('straße') && !input.toLowerCase().includes('ansprechpartner') && (
                <div class="form-section">
                  <div class="section-summary">✓ Günther Maschinenbau AG · GmbH · Aachen</div>
                  <label class="field-label">Straße *</label>
                  <input class="lux-input" placeholder="Musterstraße" />
                  <div class="form-row">
                    <input class="lux-input short" placeholder="Nr." />
                    <input class="lux-input" placeholder="PLZ" />
                  </div>
                  <label class="field-label">Ort *</label>
                  <input class="lux-input" placeholder="Aachen" />
                  <div class="form-hint">TAB → nächster Abschnitt · SHIFT+TAB ← zurück · ESC Abbrechen</div>
                </div>
              )}

              {/* Section 3: Ansprechpartner + Zusammenfassung */}
              {input.toLowerCase().includes('ansprechpartner') || input.toLowerCase().includes('telefon') ? (
                <div class="form-section">
                  <div class="section-summary">✓ Günther Maschinenbau AG · GmbH · Aachen</div>
                  <div class="section-summary">✓ Musterstraße 14, 52062 Aachen</div>
                  <label class="field-label">Ansprechpartner *</label>
                  <input class="lux-input" placeholder="R. Günther" />
                  <label class="field-label">Telefon *</label>
                  <input class="lux-input" placeholder="+49 241 8800-0" />
                  <label class="field-label">E-Mail *</label>
                  <input class="lux-input" placeholder="r.guenther@guenther-mb.de" />
                  <div class="form-hint">ENTER Firma anlegen · ESC Abbrechen</div>
                  <div class="zusammenfassung">
                    <strong>Zusammenfassung:</strong>
                    <div>Günther Maschinenbau AG · GmbH · Kammer Aachen</div>
                    <div>Musterstraße 14, 52062 Aachen</div>
                    <div>Ansprechpartner: R. Günther · +49 241 8800-0</div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Warenpositionen table (State G) */}
          {isWarenPositionen && (
            <div class="table-panel">
              <div class="table-panel__header">
                Warenpositionen · Carnet #2024-00456 · Günther Maschinenbau AG
              </div>
              <table class="wp-table">
                <thead>
                  <tr>
                    <th>Pos</th><th>Beschreibung</th><th>Menge</th>
                    <th>Einzelwert</th><th>Gesamtwert</th><th>Zoll-Nr</th>
                  </tr>
                </thead>
                <tbody>
                  {WARENPOSITIONEN.map(wp => (
                    <tr key={wp.pos}>
                      <td>{wp.pos}</td>
                      <td>{wp.beschreibung}</td>
                      <td>{wp.menge}</td>
                      <td>{wp.einzelwert.toLocaleString('de-DE')} €</td>
                      <td>{(wp.menge * wp.einzelwert).toLocaleString('de-DE')} €</td>
                      <td>{wp.zollNr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div class="wp-table__footer">
                <span>+ Neue Position hinzufügen</span>
                <span class="wp-table__total">Σ {TOTAL_WERT.toLocaleString('de-DE')} €</span>
              </div>
              <div class="form-hint">ENTER Speichern · ESC Abbrechen</div>
            </div>
          )}

          {/* Mini-form (State D3) */}
          {isMiniForm && parsed.entityType === 'firma' && (
            <div class="mini-form">
              <div class="mini-form__header">
                {parsed.entity ? getEntityDisplayName(parsed.entity, parsed.entityType) : ''} → Adresse bearbeiten
              </div>
              <label class="field-label">Anrede</label>
              <select class="lux-input"><option>z.B. Sie, Du</option></select>
              <label class="field-label">Straße</label>
              <input class="lux-input" placeholder="Gewerbepark" />
              <div class="form-row">
                <input class="lux-input short" placeholder="Nr." />
                <input class="lux-input" placeholder="PLZ" />
              </div>
              <label class="field-label">Ort</label>
              <input class="lux-input" placeholder="München" />
              <div class="form-hint">ENTER Speichern · TAB nächstes Feld · ESC Abbrechen</div>
            </div>
          )}

          {/* Inline field (State D1) - Limit ändern */}
          {isInlineField && parsed.entityType === 'carnet' && (
            <div class="inline-field">
              <div class="inline-field__header">
                {parsed.entity ? getEntityDisplayName(parsed.entity, parsed.entityType) : ''} → Limit ändern
              </div>
              <label class="field-label">Carnet #2024-00456 · Günther Maschinenbau AG → Limit ändern</label>
              <div class="inline-field__input-row">
                <input class="lux-input currency" placeholder="45.000 €" />
                <span class="inline-field__keys">
                  <kbd>ENTER</kbd> <kbd>ESC</kbd>
                </span>
              </div>
            </div>
          )}

          {/* State A: entity resolved — action suggestions */}
          {parsed.state === 'entity_only' && parsed.entity && parsed.entityType && (
            <div class="entity-preview">
              <div class="entity-preview__header">
                <span class="entity-preview__name">
                  {getEntityDisplayName(parsed.entity, parsed.entityType)}
                </span>
                <span class="entity-badge" style={{ background: getEntityColor(parsed.entityType) }}>
                  {getEntityTypeBadge(parsed.entityType)}
                </span>
                <span class="entity-preview__detail">
                  {getEntityDetails(parsed.entity, parsed.entityType)}
                </span>
              </div>

              {parsed.entityType === 'carnet' && parsed.inhaberFirma && (
                <div class="entity-preview__inhaber">
                  Aktueller Inhaber: <strong>{parsed.inhaberFirma.name}</strong>
                </div>
              )}

              {parsed.suggestions.length > 0 && (
                <div class="action-list">
                  {parsed.suggestions.map((s, i) => (
                    <div
                      key={i}
                      class={`action-list__row${i === selectedActionIdx && !!parsed.actionQuery ? ' action-list__row--active' : ''}`}
                      onClick={() => { setSelectedActionIdx(i); selectAction(i); }}
                    >
                      <span class="action-list__label">{s.label}</span>
                      <span class="action-list__token">{getActionInputToken(s.value)}</span>
                      {i === 0 && parsed.suggestions.length === 1 && (
                        <span class="candidate-hint">ENTER</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* State B: parameter pending */}
          {parsed.state === 'parameter_pending' && parsed.action && (
            <div class="param-preview">
              <div class="param-preview__header">
                → {parsed.action.label}
                <span class="param-preview__hint">(Ziel-Firma eingeben)</span>
              </div>
              {parsed.suggestions.length > 0 && (
                <div class="param-preview__suggestions">
                  <span class="actions-label">Vorschläge:</span>
                  {parsed.suggestions.map((s, i) => (
                    <button
                      key={i}
                      class="action-chip"
                      onClick={() => setInput(input + ' ' + s.label.split(' ')[0].toLowerCase())}
                    >
                      {s.label}
                      {s.metadata && <span class="action-chip__meta">({s.metadata})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* State C: confirmation */}
          {(parsed.state === 'ready' || parsed.state === 'action_pending') && parsed.action && (
            <div class="confirm-panel">
              <div class="confirm-panel__entity">
                {parsed.entity ? getEntityDisplayName(parsed.entity, parsed.entityType!) : ''}
                {parsed.entity && <span class="confirm-panel__dot"> · </span>}
                <span class="confirm-panel__detail">
                  {parsed.entity ? getEntityDetails(parsed.entity, parsed.entityType!) : ''}
                </span>
              </div>
              <div class="confirm-panel__action">
                → {parsed.action.label}
                {parsed.parameter && typeof parsed.parameter === 'object' && 'name' in parsed.parameter
                  ? ` zu: ${(parsed.parameter as Firma).name}`
                  : parsed.parameter && typeof parsed.parameter === 'number'
                  ? `: ${(parsed.entity as any).limit?.toLocaleString('de-DE')} € → ${parsed.parameter.toLocaleString('de-DE')} €`
                  : ''}
              </div>
              <div class="confirm-panel__keys">
                <span><kbd>ENTER</kbd> zum Ausführen</span>
                <span><kbd>ESC</kbd> Abbrechen</span>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .command-zone { flex-shrink: 0; padding: 12px 24px 16px; }
        .command-field {
          border: 1px solid var(--input-border); border-radius: 4px;
          background: var(--surface); overflow: hidden;
        }
        .command-field__row1 {
          display: flex; align-items: center; min-height: 40px;
          padding: 4px 12px; gap: 6px; flex-wrap: wrap;
        }
        .command-field__row1 input {
          border: none; outline: none; flex: 1; min-width: 100px;
          font-family: var(--font-mono); font-size: 14px; color: var(--navy);
          padding: 6px 0;
        }
        .command-field__row1 input::placeholder { color: var(--text-secondary); opacity: 0.6; }

        .tx-chip {
          display: inline-block; padding: 2px 8px; border-radius: 16px;
          background: var(--tx-chip-bg); color: white; font-size: 11px; font-weight: 500;
        }
        .inline-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 16px; font-size: 12px;
          font-family: var(--font-mono); white-space: nowrap; cursor: pointer;
        }
        .inline-chip--entity { color: white; }
        .inline-chip--action {
          background: var(--resolution-chip-bg); color: var(--resolution-chip-text);
        }
        .chip-remove { font-size: 10px; opacity: 0.7; margin-left: 2px; }
        .inline-chip:hover .chip-remove { opacity: 1; }

        .command-field__beispiele {
          padding: 8px 12px; border-top: 1px solid var(--secondary-nav-border);
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .beispiele-label { font-size: 11px; color: var(--text-secondary); }
        .beispiel-chip {
          padding: 3px 8px; background: var(--bg-page); color: var(--text-secondary);
          border-radius: 4px; font-size: 12px; font-family: var(--font-mono); cursor: pointer;
        }
        .beispiel-chip:hover { background: var(--secondary-nav-border); }

        /* ── Candidates list ────────────────────────────────────────── */
        .candidates-panel {
          background: var(--surface); border: 1px solid var(--secondary-nav-border);
          border-top: none; border-radius: 0 0 4px 4px; overflow: hidden;
        }
        .candidate-row {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--bg-page);
        }
        .candidate-row:last-child { border-bottom: none; }
        .candidate-row:hover, .candidate-row--active {
          background: var(--sie-bubble-bg);
        }
        .candidate-badge {
          padding: 2px 7px; border-radius: 10px; font-size: 11px;
          color: white; font-family: var(--font-ui); white-space: nowrap;
        }
        .candidate-name { font-size: 13px; color: var(--navy); font-weight: 500; flex: 1; }
        .candidate-detail { font-size: 12px; color: var(--text-secondary); }
        .candidate-hint {
          font-size: 10px; color: var(--inactive); border: 1px solid var(--input-border);
          border-radius: 3px; padding: 1px 5px; font-family: var(--font-mono);
        }

        .preview-panel {
          margin-top: 0; background: var(--surface); border-radius: 0 0 4px 4px;
          border: 1px solid var(--secondary-nav-border); border-top: none;
          padding: 12px 16px;
        }

        /* ── Progressive form (State F) ─────────────────────────────── */
        .progressive-form { padding: 4px 0; }
        .progressive-form__header {
          font-size: 13px; font-weight: 500; color: var(--navy); margin-bottom: 12px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .section-counter { font-size: 11px; color: var(--text-secondary); }
        .form-section { display: flex; flex-direction: column; gap: 8px; }
        .section-summary {
          font-size: 12px; color: #2e7d32; background: #f5f5f5;
          padding: 4px 8px; border-radius: 4px;
        }
        .form-row { display: flex; gap: 8px; }
        .lux-input.short { width: 60px; flex-shrink: 0; }
        .form-hint { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }
        .zusammenfassung {
          border-top: 1px solid var(--secondary-nav-border); padding-top: 8px;
          font-size: 12px; color: var(--text-body); display: flex;
          flex-direction: column; gap: 2px; margin-top: 8px;
        }

        /* ── Table panel (State G) ──────────────────────────────────── */
        .table-panel { padding: 4px 0; }
        .table-panel__header { font-size: 13px; font-weight: 500; color: var(--navy); margin-bottom: 8px; }
        .wp-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .wp-table th { text-align: left; font-weight: 500; color: var(--navy); padding: 4px 8px; border-bottom: 1px solid var(--secondary-nav-border); }
        .wp-table td { padding: 4px 8px; font-family: var(--font-mono); }
        .wp-table__footer { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; }
        .wp-table__footer span:first-child { color: var(--primary); cursor: pointer; }
        .wp-table__total { font-weight: 500; color: var(--navy); }

        /* ── Mini-form (State D3) ───────────────────────────────────── */
        .mini-form { padding: 4px 0; }
        .mini-form__header { font-size: 13px; font-weight: 500; color: var(--navy); margin-bottom: 12px; }

        /* ── Inline field (State D1) ────────────────────────────────── */
        .inline-field { padding: 4px 0; }
        .inline-field__header { font-size: 13px; font-weight: 500; color: var(--navy); margin-bottom: 8px; }
        .inline-field__input-row { display: flex; align-items: center; gap: 12px; }
        .inline-field__keys { font-size: 11px; color: var(--text-secondary); display: flex; gap: 8px; }

        /* ── Common input styles ────────────────────────────────────── */
        .lux-input {
          height: 40px; border: 1px solid var(--input-border); border-radius: 4px;
          padding: 6px 10px; font-size: 13px; width: 100%;
          font-family: var(--font-ui); color: var(--text-body);
        }
        .lux-input:focus { border-color: var(--input-border-focus); outline: none; }
        .lux-input.currency { width: 120px; flex-shrink: 0; }
        .field-label { font-size: 12px; font-weight: 500; color: var(--navy); margin-top: 4px; }

        /* ── Reset hint (F-13) ──────────────────────────────────────── */
        .reset-hint {
          background: var(--reset-hint-bg); border-left: 3px solid var(--reset-hint-border);
          border-radius: 4px; padding: 12px 14px; margin-bottom: 12px;
        }
        .reset-hint__header { display: flex; align-items: start; gap: 8px; font-size: 13px; }
        .reset-hint__dependent { margin-top: 8px; font-size: 12px; }
        .reset-hint__independent { margin-top: 4px; font-size: 12px; }
        .reset-hint__keys { margin-top: 10px; display: flex; gap: 12px; }
        .reset-hint__keys kbd {
          padding: 3px 8px; border: 1px solid var(--input-border);
          border-radius: 3px; font-size: 11px; font-family: var(--font-mono);
        }

        /* ── Entity preview (State A) ───────────────────────────────── */
        .entity-preview__header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .entity-preview__name { font-size: 14px; font-weight: 500; color: var(--navy); }
        .entity-preview__detail { font-size: 12px; color: var(--text-secondary); }
        .entity-preview__inhaber {
          font-size: 12px; color: var(--text-secondary); background: #eee;
          padding: 6px 10px; border-radius: 4px; margin-bottom: 8px;
        }
        .action-list { display: flex; flex-direction: column; gap: 0; margin-top: 4px; }
        .action-list__row {
          display: flex; align-items: center; gap: 10px; padding: 7px 10px;
          border-radius: 4px; cursor: pointer;
        }
        .action-list__row:hover, .action-list__row--active { background: var(--sie-bubble-bg); }
        .action-list__label { font-size: 13px; color: var(--navy); flex: 1; }
        .action-list__token {
          font-size: 11px; font-family: var(--font-mono); color: var(--text-secondary);
          background: var(--bg-page); border: 1px solid var(--secondary-nav-border);
          border-radius: 3px; padding: 1px 6px;
        }
        .actions-label { font-size: 12px; color: var(--text-secondary); }
        .action-chip {
          padding: 4px 10px; background: var(--bg-page); color: var(--primary);
          border: 1px solid var(--secondary-nav-border); border-radius: 4px;
          font-size: 12px; cursor: pointer;
        }
        .action-chip:hover { background: var(--sie-bubble-bg); }
        .action-chip__meta { font-size: 10px; color: var(--text-secondary); margin-left: 4px; }
        .preview-hint { margin-top: 8px; font-size: 11px; color: var(--inactive); font-style: italic; }

        /* ── Parameter preview (State B) ────────────────────────────── */
        .param-preview__header { font-size: 13px; font-weight: 500; color: var(--navy); margin-bottom: 8px; }
        .param-preview__hint { font-size: 12px; color: var(--warning); margin-left: 8px; font-weight: 400; }
        .param-preview__suggestions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        /* ── Confirmation panel (State C) ───────────────────────────── */
        .confirm-panel {
          border: 2px solid var(--primary); border-radius: 4px; padding: 14px 16px;
          box-shadow: var(--shadow-panel);
        }
        .confirm-panel__entity { font-size: 13px; font-family: var(--font-mono); color: var(--text-body); }
        .confirm-panel__dot { color: var(--text-secondary); }
        .confirm-panel__detail { color: var(--text-secondary); }
        .confirm-panel__action { font-size: 13px; font-weight: 500; color: var(--navy); margin-top: 8px; }
        .confirm-panel__keys {
          margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--secondary-nav-border);
          display: flex; gap: 24px; font-size: 12px; color: var(--text-secondary);
        }
        .confirm-panel__keys kbd {
          padding: 2px 8px; border: 1px solid var(--input-border);
          border-radius: 3px; font-family: var(--font-mono); font-size: 11px;
          background: var(--surface); margin-right: 4px;
        }
      `}</style>
    </div>
  );
}
