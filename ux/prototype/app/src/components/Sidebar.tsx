import { useState } from 'preact/hooks';
import { getEntityColor, getEntityTypeBadge } from '../utils/command-parser';
import type { EntityType, OffenerVorgang } from '../types';

interface Props {
  vorgänge: OffenerVorgang[];
  onVorgangClick: (entityType: EntityType, entityId: string) => void;
  selectedId?: string | null;
}

export function Sidebar({ vorgänge, onVorgangClick, selectedId }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([vorgänge[0]?.id]));

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <aside class="sidebar">
      {vorgänge.map(v => {
        const isOpen = expanded.has(v.id);
        const isSelected = selectedId === v.entityId;
        return (
          <div
            key={v.id}
            class={`sidebar-entry ${isSelected ? 'sidebar-entry--selected' : ''}`}
            onClick={() => { toggle(v.id); onVorgangClick(v.entityType, v.entityId); }}
          >
            <div class="sidebar-entry__header">
              <span
                class="entity-badge"
                style={{ background: getEntityColor(v.entityType) }}
              >
                {getEntityTypeBadge(v.entityType)}
              </span>
              <span class="sidebar-entry__title">{v.title}</span>
              <span class="sidebar-entry__chevron">{isOpen ? '∧' : '∨'}</span>
            </div>
            <div class="sidebar-entry__clerk">{v.clerk}</div>
            {isOpen && (
              <div class="sidebar-entry__details">
                <div class="sidebar-entry__entity-name">{v.entityId}</div>
              </div>
            )}
          </div>
        );
      })}
      <style>{`
        .sidebar {
          width: 220px; min-width: 220px; background: var(--sidebar-bg);
          height: 100%; overflow-y: auto; padding: 12px 0;
        }
        .sidebar-entry { padding: 8px 12px; cursor: pointer; }
        .sidebar-entry:hover { background: rgba(0,0,0,0.04); }
        .sidebar-entry--selected { background: rgba(0, 80, 160, 0.08); }
        .sidebar-entry__header { display: flex; align-items: center; gap: 8px; }
        .entity-badge {
          display: inline-block; padding: 2px 8px; border-radius: 16px;
          font-size: 11px; color: #fff; white-space: nowrap;
        }
        .sidebar-entry__title { flex: 1; font-size: 13px; font-weight: 500; }
        .sidebar-entry__chevron { color: var(--text-secondary); font-size: 12px; }
        .sidebar-entry__clerk {
          font-size: 12px; color: var(--text-secondary); margin-left: 8px; margin-top: 2px;
        }
        .sidebar-entry__details { margin-top: 6px; padding-left: 8px; }
        .sidebar-entry__entity-name { font-size: 13px; font-weight: 500; color: var(--navy); }
      `}</style>
    </aside>
  );
}
