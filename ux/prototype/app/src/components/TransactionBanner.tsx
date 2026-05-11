import type { Transaction } from '../types';

interface Props {
  transaction: Transaction;
  onSubmit: () => void;
  onDiscard: () => void;
}

export function TransactionBanner({ transaction, onSubmit, onDiscard }: Props) {
  const isReview = transaction.status === 'zur prüfung';

  return (
    <div class="tx-banner">
      <div class="tx-banner__info">
        <span class="tx-banner__badge">TRANSAKTION</span>
        <span class="tx-banner__number">{transaction.number}</span>
        <span class="tx-banner__meta">
          {transaction.steps.length} Schritt{transaction.steps.length !== 1 ? 'e' : ''} · {transaction.author}
        </span>
        {isReview && <span class="tx-banner__review-badge">Zur Prüfung</span>}
      </div>
      <div class="tx-banner__actions">
        {!isReview ? (
          <>
            <button class="btn btn--primary" onClick={onSubmit}>Einreichen zur Prüfung</button>
            <button class="btn btn--outline-warning" onClick={onDiscard}>Transaktion verwerfen</button>
          </>
        ) : (
          <>
            <button class="btn btn--success" onClick={onSubmit}>Alle ausführen</button>
            <button class="btn btn--outline" onClick={onDiscard}>ESC</button>
          </>
        )}
      </div>
      <style>{`
        .tx-banner {
          flex-shrink: 0; padding: 10px 16px;
          background: var(--reset-hint-bg); border-bottom: 1px solid var(--warning);
          display: flex; align-items: center; justify-content: space-between;
        }
        .tx-banner__info { display: flex; align-items: center; gap: 10px; }
        .tx-banner__badge {
          padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 600;
          color: white; background: var(--warning);
        }
        .tx-banner__number { font-size: 13px; color: var(--text-body); }
        .tx-banner__meta { font-size: 12px; color: var(--text-secondary); }
        .tx-banner__review-badge {
          padding: 2px 8px; border: 1px solid var(--warning);
          border-radius: 3px; font-size: 11px; color: var(--warning);
        }
        .tx-banner__actions { display: flex; gap: 8px; }
        .btn {
          padding: 6px 14px; border-radius: 4px; font-size: 12px;
          cursor: pointer; border: none; font-weight: 500;
        }
        .btn--primary { background: var(--primary); color: white; }
        .btn--success { background: #2e7d32; color: white; }
        .btn--outline-warning {
          background: transparent; border: 1px solid var(--warning); color: var(--warning);
        }
        .btn--outline {
          background: transparent; border: 1px solid var(--input-border); color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
