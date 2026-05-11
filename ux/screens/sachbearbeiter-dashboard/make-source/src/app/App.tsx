import { useState } from 'react';
import ScopeBar from './components/ihk-new/ScopeBar';
import ChatHistory from './components/ihk-new/ChatHistory';
import BottomCommandField from './components/ihk-new/BottomCommandField';
import OffeneVorgaengeSidebar from './components/ihk-new/OffeneVorgaengeSidebar';
import VorgangshistoriePanel from './components/ihk-new/VorgangshistoriePanel';
import TransactionBanner from './components/ihk-new/TransactionBanner';
import { users, offeneVorgänge, initialTimelineEvents, firmen, carnets, prüfungen } from './data/ihk-data';
import { getEntityDisplayName } from './utils/command-parser';
import type { TimelineEvent, ParsedCommand, OffenerVorgang, Entity, EntityType, Transaction, TransactionStep } from './types/ihk';

let txCounter = 1;

export default function App() {
  const [kammer, setKammer] = useState('Aachen');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialTimelineEvents);
  const [selectedEntity, setSelectedEntity] = useState<{ entity: Entity; type: EntityType } | null>(null);
  const [recalledCommand, setRecalledCommand] = useState<string>('');
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);

  const currentUser = users[0]; // K. Huber

  const handleExecuteCommand = (parsed: ParsedCommand) => {
    if (parsed.state !== 'ready' && parsed.state !== 'action_pending') return;
    if (!parsed.entity || !parsed.entityType || !parsed.action) return;

    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const entityId =
      (parsed.entity as any).id ?? '';

    let details = '';
    if (parsed.action.id === 'limit' && parsed.parameter) {
      const oldLimit = (parsed.entity as any).limit;
      details = `${oldLimit?.toLocaleString('de-DE')} € → ${parsed.parameter.toLocaleString('de-DE')} €`;
    } else if (parsed.action.id === 'verschieben' && parsed.parameter) {
      details = `→ ${parsed.parameter.name}`;
    } else if (parsed.action.id === 'bearbeiten' && parsed.parameter) {
      details = `${parsed.parameter.strasse} ${parsed.parameter.hausnummer}, ${parsed.parameter.plz} ${parsed.parameter.ort}`;
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

    if (activeTransaction) {
      // Append step to active transaction
      const step: TransactionStep = {
        id: `step-${Date.now()}`,
        entityType: parsed.entityType,
        entityId,
        action: parsed.action.label,
        details,
        commandTokens,
      };
      setActiveTransaction((tx) =>
        tx ? { ...tx, steps: [...tx.steps, step] } : tx
      );
      return;
    }

    const newEvent: TimelineEvent = {
      id: `te-${Date.now()}`,
      timestamp,
      user: currentUser.name,
      entityType: parsed.entityType,
      entityId,
      action: parsed.action.label,
      details,
      commandTokens,
    };

    setTimelineEvents((prev) => [...prev, newEvent]);
  };

  const handleRepeatCommand = (command: string) => {
    setRecalledCommand(command);
    setTimeout(() => setRecalledCommand(''), 100);
  };

  const handleVorgangClick = (vorgang: OffenerVorgang) => {
    let entity: Entity | undefined;
    const entityType = vorgang.entityType;

    if (vorgang.entityType === 'firma') entity = firmen.find((f) => f.id === vorgang.entityId);
    else if (vorgang.entityType === 'carnet') entity = carnets.find((c) => c.id === vorgang.entityId);
    else if (vorgang.entityType === 'prüfung') entity = prüfungen.find((p) => p.id === vorgang.entityId);

    if (entity) setSelectedEntity({ entity, type: entityType });
  };

  const handleStartTransaction = () => {
    const num = `#TX-${new Date().getFullYear()}-${String(txCounter++).padStart(3, '0')}`;
    setActiveTransaction({
      id: `tx-${Date.now()}`,
      number: num,
      status: 'entwurf',
      author: currentUser.name,
      steps: [],
      createdAt: new Date().toISOString(),
    });
  };

  const handleSubmitTransaction = () => {
    if (!activeTransaction) return;
    if (activeTransaction.status === 'entwurf') {
      setActiveTransaction((tx) => tx ? { ...tx, status: 'zur prüfung', submittedAt: new Date().toISOString() } : tx);
    } else if (activeTransaction.status === 'zur prüfung') {
      // Execute all steps
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const newEvents: TimelineEvent[] = activeTransaction.steps.map((step) => ({
        id: `te-${Date.now()}-${step.id}`,
        timestamp,
        user: currentUser.name,
        entityType: step.entityType,
        entityId: step.entityId,
        action: step.action,
        details: step.details,
        commandTokens: step.commandTokens,
        transactionId: activeTransaction.id,
      }));
      setTimelineEvents((prev) => [...prev, ...newEvents]);
      setActiveTransaction(null);
    }
  };

  const handleDiscardTransaction = () => setActiveTransaction(null);

  return (
    <div className="h-screen flex flex-col relative" style={{ backgroundColor: '#f0f4f8' }}>
      {/* Zone 1: Scope Bar */}
      <ScopeBar kammer={kammer} onKammerChange={setKammer} userName={currentUser.name} userRole={currentUser.rolle} />

      {/* Transaction banner (between Zone 1 and Zone 2/3) */}
      {activeTransaction && (
        <TransactionBanner
          transaction={activeTransaction}
          onSubmit={handleSubmitTransaction}
          onDiscard={handleDiscardTransaction}
        />
      )}

      {/* Zones 2 + 3 */}
      <div className="flex-1 flex overflow-hidden">
        {/* Offene Vorgänge sidebar */}
        <OffeneVorgaengeSidebar vorgaenge={offeneVorgänge} onVorgangClick={handleVorgangClick} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Zone 3 — Chat history (scrollable) */}
          <div className="flex-1 overflow-y-auto">
            <ChatHistory
              events={timelineEvents}
              currentUser={currentUser.name}
              onRepeatCommand={handleRepeatCommand}
            />
          </div>

          {/* Zone 2 — Command field (stationary, anchored at bottom of chat area) */}
          <div className="w-full">
            <div className="w-full max-w-4xl mx-auto px-8">
              <BottomCommandField
                onExecute={handleExecuteCommand}
                recalledCommand={recalledCommand}
                transactionId={activeTransaction?.id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vorgangshistorie Panel */}
      {selectedEntity && (
        <VorgangshistoriePanel
          entity={selectedEntity.entity}
          entityType={selectedEntity.type}
          events={timelineEvents}
          onClose={() => setSelectedEntity(null)}
          onEventClick={() => {}}
        />
      )}

      {/* Dev: start transaction button (remove once wired to a command) */}
      {!activeTransaction && (
        <button
          onClick={handleStartTransaction}
          className="fixed bottom-4 right-4 px-3 py-2 rounded text-[11px] text-white shadow-md"
          style={{ backgroundColor: '#e65100' }}
          title="Neue Transaktion starten"
        >
          + TX
        </button>
      )}
    </div>
  );
}
