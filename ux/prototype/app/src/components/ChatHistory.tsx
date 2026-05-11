import { useRef, useEffect } from 'preact/hooks';
import { getEntityColor, getEntityTypeBadge } from '../utils/command-parser';
import type { TimelineEvent } from '../types';

interface Props {
  events: TimelineEvent[];
  currentUser: string;
  onRepeat: (cmd: string) => void;
}

export function ChatHistory({ events, currentUser, onRepeat }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  // The chat stream shows only the logged-in user's own commands and system
  // follow-up events. Colleague actions belong exclusively in the Vorgangshistorie.
  const visibleEvents = events.filter(ev =>
    ev.source === 'own' || ev.source === 'system' || ev.user === currentUser || ev.user === 'System'
  );

  return (
    <div class="chat-area">
      {visibleEvents.map(ev => {
        const isSystem = ev.source === 'system' || ev.user === 'System';

        return (
          <div key={ev.id}>
            {/* Sie: bubble — only for own commands that have tokens */}
            {!isSystem && ev.commandTokens && (
              <div class="chat-entry">
                <div class="bubble-meta">
                  <span class="bubble-meta__label">Sie:</span>
                  <span class="bubble-meta__time">{ev.timestamp}</span>
                </div>
                <div class="sie-bubble">{ev.commandTokens}</div>
              </div>
            )}

            {/* Aktion: bubble — own result or system event */}
            <div class="chat-entry chat-entry--right">
              <div class="bubble-meta bubble-meta--right">
                <span class="bubble-meta__time">{ev.timestamp}</span>
                <span class="bubble-meta__label">Aktion:</span>
              </div>
              <div class={`aktion-bubble ${isSystem ? 'aktion-bubble--system' : ''}`}>
                <span class="entity-badge" style={{ background: getEntityColor(ev.entityType) }}>
                  {isSystem ? 'System' : getEntityTypeBadge(ev.entityType)}
                </span>
                <div class="aktion-bubble__action">{ev.action}</div>
                {ev.details && <div class="aktion-bubble__details">{ev.details}</div>}
                {!isSystem && (
                  <button
                    class="reset-btn"
                    title="Zurücksetzen auf diesen Schritt"
                    onClick={(e) => { e.stopPropagation(); onRepeat(ev.commandTokens); }}
                  >↩</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
      <style>{`
        .chat-area {
          flex: 1; overflow-y: auto; padding: 16px 24px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .chat-entry { display: flex; flex-direction: column; gap: 4px; }
        .chat-entry--right { align-items: flex-end; }
        .bubble-meta {
          display: flex; align-items: baseline; gap: 8px; font-size: 10px;
        }
        .bubble-meta--right { justify-content: flex-end; }
        .bubble-meta__label { font-weight: 500; color: var(--navy); }
        .bubble-meta__time { color: var(--text-secondary); }
        .sie-bubble {
          background: var(--sie-bubble-bg); border-radius: 12px;
          padding: 8px 14px; font-family: var(--font-mono);
          font-size: 13px; color: var(--navy); max-width: 40%; margin-left: 16px;
        }
        .aktion-bubble {
          background: var(--surface); border-left: 3px solid var(--aktion-own-border);
          border-radius: 12px; padding: 10px 14px; max-width: 60%;
          margin-right: 16px; position: relative; box-shadow: var(--shadow-card);
        }
        .aktion-bubble--colleague {
          background: var(--aktion-colleague-bg); border-left: none;
        }
        .aktion-bubble--system {
          background: var(--aktion-system-bg); border-left: 3px solid var(--aktion-system-border);
        }
        .aktion-bubble__action { margin-top: 6px; font-size: 13px; font-weight: 500; color: var(--navy); }
        .aktion-bubble__details { margin-top: 4px; font-size: 13px; color: var(--text-body); }
        .reset-btn {
          position: absolute; top: 8px; right: 8px;
          width: 24px; height: 24px; border: none; background: none;
          color: var(--primary); cursor: pointer; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .reset-btn:hover { background: var(--sie-bubble-bg); }
      `}</style>
    </div>
  );
}
