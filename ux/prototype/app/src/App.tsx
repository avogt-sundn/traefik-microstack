import { useState } from 'preact/hooks';
import { ScopeBar } from './components/ScopeBar';
import { Sidebar } from './components/Sidebar';
import { ChatHistory } from './components/ChatHistory';
import { CommandField } from './components/CommandField';
import { TransactionBanner } from './components/TransactionBanner';
import { VorgangshistoriePanel } from './components/VorgangshistoriePanel';
import { initialTimelineEvents, offeneVorgänge, firmen, carnets, prüfungen } from './data/ihk-data';
import { getEntityDisplayName } from './utils/command-parser';
import type { TimelineEvent, ParsedCommand, Entity, EntityType, Transaction, TransactionStep } from './types';
import './app.css';

let txCounter = 1;

export function App() {
  const [events, setEvents] = useState<TimelineEvent[]>(initialTimelineEvents);
  const [selectedEntity, setSelectedEntity] = useState<{ entity: Entity; type: EntityType } | null>(null);
  const [selectedVorgangId, setSelectedVorgangId] = useState<string | null>(null);
  const [recalledCommand, setRecalledCommand] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  const currentUser = 'Katrin';

  const handleExecute = (parsed: ParsedCommand) => {
    if (parsed.state !== 'ready' && parsed.state !== 'action_pending') return;
    if (!parsed.entity || !parsed.entityType || !parsed.action) return;

    const now = new Date();
    const date = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const entityId = (parsed.entity as any).id ?? '';

    let details = '';
    if (parsed.action.id === 'limit' && parsed.parameter) {
      const oldLimit = (parsed.entity as any).limit;
      details = `${oldLimit?.toLocaleString('de-DE')} → ${parsed.parameter.toLocaleString('de-DE')} €`;
    } else if (parsed.action.id === 'verschieben' && parsed.parameter) {
      details = `→ ${parsed.parameter.name}`;
    }

    const entityName = getEntityDisplayName(parsed.entity, parsed.entityType);
    let commandTokens = entityName.split(' ')[0].toLowerCase();
    if (parsed.action.id === 'limit') {
      commandTokens += ` carnet limit`;
      if (parsed.parameter) commandTokens += ` ${parsed.parameter}`;
    } else if (parsed.action.id === 'verschieben') {
      commandTokens += ' carnet inhaber wechseln';
      if (parsed.parameter) commandTokens += ` ${parsed.parameter.name.split(' ')[0].toLowerCase()}`;
    } else {
      commandTokens += ` ${parsed.action.id}`;
    }

    if (transaction) {
      const step: TransactionStep = {
        id: `step-${Date.now()}`, entityType: parsed.entityType, entityId,
        action: parsed.action.label, details, commandTokens,
      };
      setTransaction(tx => tx ? { ...tx, steps: [...tx.steps, step] } : tx);
      return;
    }

    const newEvent: TimelineEvent = {
      id: `te-${Date.now()}`, date, timestamp, user: currentUser,
      entityType: parsed.entityType, entityId,
      action: parsed.action.label, details, commandTokens, source: 'own',
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const handleRepeat = (cmd: string) => {
    setRecalledCommand(cmd);
    setTimeout(() => setRecalledCommand(''), 50);
  };

  const handleVorgangClick = (entityType: EntityType, entityId: string) => {
    let entity: Entity | undefined;
    if (entityType === 'firma') entity = firmen.find(f => f.id === entityId);
    else if (entityType === 'carnet') entity = carnets.find(c => c.id === entityId);
    else if (entityType === 'prüfung') entity = prüfungen.find(p => p.id === entityId);
    if (entity) setSelectedEntity({ entity, type: entityType });

    // Track selected Vorgang for sidebar highlighting
    setSelectedVorgangId(entityId);
  };

  const handleStartTx = () => {
    const num = `#TX-${new Date().getFullYear()}-${String(txCounter++).padStart(3, '0')}`;
    setTransaction({
      id: `tx-${Date.now()}`, number: num, status: 'entwurf',
      author: currentUser, steps: [], createdAt: new Date().toISOString(),
    });
  };

  const handleSubmitTx = () => {
    if (!transaction) return;
    if (transaction.status === 'entwurf') {
      setTransaction(tx => tx ? { ...tx, status: 'zur prüfung' } : tx);
    } else {
      const now = new Date();
      const date = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const newEvents: TimelineEvent[] = transaction.steps.map(step => ({
        id: `te-${Date.now()}-${step.id}`, date, timestamp, user: currentUser,
        entityType: step.entityType, entityId: step.entityId,
        action: step.action, details: step.details, commandTokens: step.commandTokens,
        source: 'own' as const, transactionId: transaction.id,
      }));
      setEvents(prev => [...prev, ...newEvents]);
      setTransaction(null);
    }
  };

  return (
    <div class="shell">
      <ScopeBar userName={currentUser} />
      {transaction && (
        <TransactionBanner
          transaction={transaction}
          onSubmit={handleSubmitTx}
          onDiscard={() => setTransaction(null)}
        />
      )}
      <div class="main-area">
        <Sidebar
          vorgänge={offeneVorgänge}
          onVorgangClick={handleVorgangClick}
          selectedId={selectedVorgangId}
        />
        <div class="strom-column">
          <ChatHistory events={events} currentUser={currentUser} onRepeat={handleRepeat} />
          <div class="jetzt-linie" />
          <CommandField
            onExecute={handleExecute}
            recalledCommand={recalledCommand}
            transactionId={transaction?.id}
          />
        </div>
      </div>
      {selectedEntity && (
        <VorgangshistoriePanel
          entity={selectedEntity.entity}
          entityType={selectedEntity.type}
          events={events}
          onClose={() => { setSelectedEntity(null); setSelectedVorgangId(null); }}
        />
      )}
      {!transaction && (
        <button class="tx-start-btn" onClick={handleStartTx} title="Neue Transaktion starten">+ TX</button>
      )}
    </div>
  );
}
