import { getEntityDisplayName, getEntityDetails, getEntityColor, getEntityTypeBadge } from '../utils/command-parser';
import { firmen } from '../data/ihk-data';
import type { Entity, EntityType, TimelineEvent } from '../types';

interface Props {
  entity: Entity;
  entityType: EntityType;
  events: TimelineEvent[];
  onClose: () => void;
}

// Source badge colors per CLAUDE spec (F-11)
const SOURCE_BADGES: Record<string, string> = {
  Portal: '#00897b',
  System: '#9e9e9e',
  Allianz: '#7c3aed',
  Zoll: '#7c3aed',
};

export function VorgangshistoriePanel({ entity, entityType, events, onClose }: Props) {
  const entityId = (entity as any).id;

  // Filter events by entity, sort chronologically
  const relevantEvents = events
    .filter(ev => ev.entityId === entityId || (entityType === 'firma' && firmen.find(f => f.id === ev.entityId)))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const groupedEvents = relevantEvents.reduce<Record<string, TimelineEvent[]>>((acc, ev) => {
    const key = ev.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  return (
    <div class="vorgangshistorie">
      <button class="panel-close" onClick={onClose}>&times;</button>
      <div class="vorgangshistorie__header">
        <div class="vorgangshistorie__title">
          <span class="entity-badge" style={{ background: getEntityColor(entityType) }}>
            {getEntityTypeBadge(entityType)}
          </span>
          <span class="vorgangshistorie__name">{getEntityDisplayName(entity, entityType)}</span>
        </div>
        <div class="vorgangshistorie__subtitle">{getEntityDetails(entity, entityType)}</div>
        <div class="vorgangshistorie__section-label">Vorgangshistorie</div>
      </div>

      {/* Date separators */}
      <div class="vorgangshistorie__entries">
        {relevantEvents.length === 0 && (
          <div class="vorgangshistorie__empty">Keine Einträge</div>
        )}

        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date}>
            <div class="date-separator">
              <span class="date-label">{date}</span>
            </div>

            {dateEvents.map(ev => (
              <div key={ev.id} class="vorgangshistorie__entry">
                <span class="vorgangshistorie__time">{ev.timestamp}</span>
                <div class="vorgangshistorie__entry-body">
                  <div class="vorgangshistorie__entry-content">
                    {ev.source === 'system' && (
                      <span class="source-badge" style={{ background: SOURCE_BADGES.System }}>System</span>
                    )}
                    {(ev.source === 'colleague' || ev.source === 'own') && (
                      <span class="source-badge" style={{ background: '#0050a0' }}>{ev.user}</span>
                    )}
                    <span class="vorgangshistorie__action">{ev.action}</span>
                  </div>
                  {ev.details && <div class="vorgangshistorie__detail">{ev.details}</div>}
                  {ev.source !== 'system' && (
                    <div class="vorgangshistorie__last-edit">
                      Zuletzt bearbeitet: {ev.user}, {date} {ev.timestamp}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        .vorgangshistorie {
          position: absolute; left: 220px; top: 0; bottom: 0; width: 400px;
          background: var(--surface); box-shadow: var(--shadow-overlay);
          padding: 16px; overflow-y: auto; z-index: 100;
        }
        .panel-close {
          position: absolute; top: 12px; right: 12px;
          background: none; border: none; font-size: 18px;
          cursor: pointer; color: var(--text-secondary); line-height: 1;
        }
        .panel-close:hover { color: var(--text-body); }

        .vorgangshistorie__header { margin-bottom: 16px; padding-right: 24px; }
        .vorgangshistorie__title { display: flex; align-items: center; gap: 8px; }
        .vorgangshistorie__name { font-size: 14px; font-weight: 500; color: var(--navy); }
        .vorgangshistorie__subtitle { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
        .vorgangshistorie__section-label {
          font-size: 12px; font-weight: 500; color: var(--navy);
          margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--secondary-nav-border);
        }

        .date-separator {
          display: flex; align-items: center; gap: 8px; margin: 12px 0 8px;
          border-bottom: 1px solid var(--secondary-nav-border);
        }
        .date-label { font-size: 11px; color: var(--text-secondary); text-align: center; }

        .vorgangshistorie__entries { display: flex; flex-direction: column; gap: 8px; }
        .vorgangshistorie__empty { font-size: 12px; color: var(--text-secondary); font-style: italic; }
        .vorgangshistorie__entry {
          display: grid; grid-template-columns: 50px 1fr; gap: 8px; padding: 6px 0;
        }
        .vorgangshistorie__time { font-size: 11px; color: var(--text-secondary); padding-top: 2px; }
        .vorgangshistorie__entry-body { display: flex; flex-direction: column; gap: 2px; }
        .vorgangshistorie__entry-content { font-size: 13px; display: flex; align-items: center; gap: 6px; }
        .source-badge {
          display: inline-block; padding: 1px 6px; border-radius: 4px;
          font-size: 10px; color: white; white-space: nowrap;
        }
        .vorgangshistorie__action { color: var(--text-body); font-weight: 500; }
        .vorgangshistorie__detail { font-size: 12px; color: var(--text-secondary); }
        .vorgangshistorie__last-edit { font-size: 11px; color: var(--inactive); font-style: italic; }
      `}</style>
    </div>
  );
}
