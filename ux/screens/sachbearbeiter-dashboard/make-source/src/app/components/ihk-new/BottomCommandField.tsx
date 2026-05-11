import { useState, KeyboardEvent, useEffect, useRef } from 'react';
import { parseCommand, getEntityDisplayName, getEntityDetails, getEntityColor } from '../../utils/command-parser';
import { firmen } from '../../data/ihk-data';
import type { ParsedCommand, ResolvedChip, Firma, Carnet, EntityType } from '../../types/ihk';

interface BottomCommandFieldProps {
  onExecute: (command: ParsedCommand) => void;
  recalledCommand?: string;
  transactionId?: string | null;
}

const EXAMPLES = [
  'günther carnet limit 45000',
  'becker adresse',
  'prüfung p-012 genehmigen',
  'carnet günther inhaber wechseln',
  'müller email',
];

export default function BottomCommandField({
  onExecute,
  recalledCommand,
  transactionId,
}: BottomCommandFieldProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Recall: pre-fill input from ↩ button in chat history
  useEffect(() => {
    if (recalledCommand) {
      setInput(recalledCommand);
      inputRef.current?.focus();
    }
  }, [recalledCommand]);

  const parsed = parseCommand(input);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (parsed.state === 'ready' || parsed.state === 'action_pending') {
        onExecute(parsed);
        setInput('');
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setInput('');
    }
  };

  // Remove a chip by position — clears everything at and after that chip
  const removeChip = (chipId: string) => {
    const idx = parsed.chips.findIndex((c) => c.id === chipId);
    if (idx === 0) {
      // Entity chip removed → clear everything
      setInput('');
    }
    // For action/param chips, the parser will just re-resolve — no separate state to clear.
    // Truncate input to remove the action/param token group.
    if (idx === 1) {
      // Keep only entity-resolving prefix
      const entityName = parsed.entity
        ? getEntityDisplayName(parsed.entity, parsed.entityType!)
        : '';
      setInput(entityName.split(' ')[0].toLowerCase());
    }
    if (idx === 2) {
      // Remove parameter portion
      const entityName = parsed.entity
        ? getEntityDisplayName(parsed.entity, parsed.entityType!).split(' ')[0].toLowerCase()
        : '';
      const actionWord = parsed.action?.id === 'verschieben' ? 'inhaber wechseln' : parsed.action?.id ?? '';
      setInput(`${entityName} ${actionWord}`);
    }
  };

  // ── Derive preview state ──────────────────────────────────────────────────

  const isResetHint = !!recalledCommand && input === recalledCommand;
  const inhaberFirma: Firma | undefined =
    parsed.entityType === 'carnet'
      ? firmen.find((f) => f.id === (parsed.entity as Carnet)?.inhaberId)
      : undefined;

  return (
    <div className="bg-white">
      {/* Jetzt-Linie */}
      <div className="h-0.5" style={{ backgroundColor: '#0050a0' }} />

      <div className="px-4 py-4">
        {/* Row 1 — Text input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Entität oder Befehl eingeben …"
            autoFocus
            className="w-full px-4 py-3 border rounded font-mono text-[14px] outline-none focus:border-[#0050a0] transition-colors"
            style={{
              borderColor: parsed.state === 'ready' ? '#0050a0' : '#b0bec5',
              color: '#003064',
              borderRadius: '4px',
            }}
          />
          {/* TX chip indicator inside input when in transaction mode */}
          {transactionId && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[11px] text-white"
              style={{ backgroundColor: '#e65100' }}
            >
              TX
            </span>
          )}
        </div>

        {/* Row 2 — Resolved chips (below input, per spec COMP-B) */}
        {parsed.chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {parsed.chips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => removeChip(chip.id)}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium hover:opacity-75 transition-opacity"
                style={{
                  backgroundColor:
                    chip.type === 'entity'
                      ? getEntityColor(chip.value.type as EntityType)
                      : '#e8f5e9',
                  color: chip.type === 'entity' ? '#ffffff' : '#2e7d32',
                }}
              >
                {chip.label}
                <span className="ml-1 opacity-60 text-[10px]">×</span>
              </button>
            ))}
          </div>
        )}

        {/* Preview / hint area */}
        {parsed.state !== 'empty' ? (
          <div className="mt-3">
            {/* Reset hint (F-13): recalled command matches current input */}
            {isResetHint && (
              <div
                className="px-4 py-3 rounded mb-3"
                style={{
                  backgroundColor: '#fff3e0',
                  borderLeft: '3px solid #e65100',
                }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span style={{ color: '#e65100' }}>⚠</span>
                  <span className="text-[13px]" style={{ color: '#1a1a2e' }}>
                    Zurücksetzen auf diesen Schritt — ENTER macht diese Aktion und alle
                    abhängigen Folgeaktionen rückgängig.
                  </span>
                </div>
                <div className="text-[12px] space-y-1 pl-5">
                  <div style={{ color: '#c62828' }}>Rückgängig: abhängige Aktionen</div>
                  <div style={{ color: '#2e7d32' }}>Erhalten: unabhängige Aktionen</div>
                </div>
                <div className="mt-3 flex gap-4 pl-5">
                  <kbd
                    className="px-2 py-0.5 text-[11px] rounded font-mono"
                    style={{ border: '1px solid #b0bec5', color: '#e65100' }}
                  >
                    ENTER Zurücksetzen + neu ausführen
                  </kbd>
                  <kbd
                    className="px-2 py-0.5 text-[11px] rounded font-mono"
                    style={{ border: '1px solid #b0bec5', color: '#555555' }}
                  >
                    ESC Abbrechen
                  </kbd>
                </div>
              </div>
            )}

            {/* State A / E1 — entity resolved, no action yet */}
            {parsed.state === 'entity_only' && parsed.entity && parsed.entityType && (
              <div
                className="px-4 py-3 rounded"
                style={{ backgroundColor: '#f5f5f5', border: '1px solid #dce3ec' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[13px] font-medium" style={{ color: '#1a1a2e' }}>
                    {getEntityDisplayName(parsed.entity, parsed.entityType)}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] text-white"
                    style={{ backgroundColor: getEntityColor(parsed.entityType) }}
                  >
                    {parsed.entityType === 'carnet' ? 'Carnet' : parsed.entityType === 'firma' ? 'Firma' : 'Prüfung'}
                  </span>
                  <span className="text-[12px]" style={{ color: '#555555' }}>
                    {getEntityDetails(parsed.entity, parsed.entityType)}
                  </span>
                </div>

                {/* State E2 — Carnet with Aktueller Inhaber row */}
                {parsed.entityType === 'carnet' && inhaberFirma && (
                  <div
                    className="text-[12px] px-3 py-2 rounded mb-2"
                    style={{ backgroundColor: '#eeeeee', color: '#555555' }}
                  >
                    Aktueller Inhaber: <span style={{ color: '#1a1a2e' }}>{inhaberFirma.name}</span>
                  </div>
                )}

                {/* Action hints as chips (State A) or horizontal suggestion chips (State E2) */}
                {parsed.suggestions && parsed.suggestions.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px]" style={{ color: '#555555' }}>
                      {parsed.entityType === 'carnet' ? 'Vorschläge:' : 'Aktionen:'}
                    </span>
                    {parsed.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(input + ' ' + s.label.toLowerCase())}
                        className="px-2 py-1 rounded text-[12px] hover:bg-[#e8f0fa] transition-colors"
                        style={{ backgroundColor: '#f0f4f8', color: '#0050a0', border: '1px solid #dce3ec' }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-[11px]" style={{ color: '#9e9e9e' }}>
                  weitertippen oder Tab zum Auswählen
                </div>
              </div>
            )}

            {/* State B — action matched, parameter required */}
            {parsed.state === 'parameter_pending' && parsed.action && (
              <div
                className="px-4 py-3 rounded"
                style={{ backgroundColor: '#f5f5f5', border: '1px solid #dce3ec' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[13px] font-medium" style={{ color: '#003064' }}>
                    → {parsed.action.label}
                  </span>
                  <span className="text-[12px]" style={{ color: '#e65100' }}>
                    (Ziel-Firma eingeben)
                  </span>
                </div>

                {parsed.suggestions && parsed.suggestions.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px]" style={{ color: '#555555' }}>Vorschläge:</span>
                    {parsed.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(input + ' ' + s.label.split(' ')[0].toLowerCase())}
                        className="px-2 py-1 rounded text-[12px] hover:bg-[#e8f0fa] transition-colors"
                        style={{ backgroundColor: '#f0f4f8', color: '#0050a0', border: '1px solid #dce3ec' }}
                      >
                        {s.label}
                        {s.metadata && (
                          <span className="ml-1 text-[10px]" style={{ color: '#555555' }}>
                            ({s.metadata})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-[11px]" style={{ color: '#9e9e9e' }}>
                  ↓ Weitertippen oder ENTER für Dialog
                </div>
              </div>
            )}

            {/* State C / E4 — fully resolved, confirmation panel */}
            {(parsed.state === 'ready' || parsed.state === 'action_pending') && parsed.action && (
              <div
                className="px-4 py-4 rounded"
                style={{ backgroundColor: '#ffffff', border: '2px solid #0050a0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                <div className="text-[13px] mb-3 font-mono" style={{ color: '#1a1a2e' }}>
                  <span>
                    {parsed.entity ? getEntityDisplayName(parsed.entity, parsed.entityType!) : ''}
                  </span>
                  {parsed.entity && (
                    <span className="mx-2" style={{ color: '#555555' }}>·</span>
                  )}
                  <span style={{ color: '#555555' }}>
                    {parsed.entity ? getEntityDetails(parsed.entity, parsed.entityType!) : ''}
                  </span>
                </div>
                <div className="text-[13px] font-medium mb-4" style={{ color: '#003064' }}>
                  → {parsed.action.label}
                  {parsed.parameter && typeof parsed.parameter === 'object' && 'name' in parsed.parameter
                    ? ` zu: ${(parsed.parameter as Firma).name}`
                    : parsed.parameter && typeof parsed.parameter === 'number'
                    ? `: ${(parsed.entity as any).limit?.toLocaleString('de-DE')} € → ${parsed.parameter.toLocaleString('de-DE')} €`
                    : ''}
                </div>
                <div
                  className="flex items-center gap-6"
                  style={{ borderTop: '1px solid #dce3ec', paddingTop: '12px' }}
                >
                  <div className="flex items-center gap-2">
                    <kbd
                      className="px-3 py-1 rounded text-[12px] font-mono shadow-sm"
                      style={{ border: '1px solid #b0bec5', backgroundColor: '#ffffff' }}
                    >
                      ENTER
                    </kbd>
                    <span className="text-[12px] font-medium" style={{ color: '#0050a0' }}>
                      zum Ausführen
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd
                      className="px-3 py-1 rounded text-[12px] font-mono shadow-sm"
                      style={{ border: '1px solid #b0bec5', backgroundColor: '#ffffff' }}
                    >
                      ESC
                    </kbd>
                    <span className="text-[12px]" style={{ color: '#555555' }}>
                      Abbrechen
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty state — example commands */
          <div className="mt-3 px-2 py-2">
            <div className="text-[11px] mb-2" style={{ color: '#555555' }}>
              Beispiele:
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  className="px-2 py-1 rounded text-[11px] font-mono hover:bg-[#e8f0fa] transition-colors"
                  style={{ color: '#555555', backgroundColor: '#f5f5f5', border: '1px solid #dce3ec' }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
