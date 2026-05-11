import type { Transaction } from '../../types/ihk';

interface TransactionBannerProps {
  transaction: Transaction;
  onSubmit: () => void;
  onDiscard: () => void;
}

export default function TransactionBanner({ transaction, onSubmit, onDiscard }: TransactionBannerProps) {
  const isReviewMode = transaction.status === 'zur prüfung';

  return (
    <div
      className="px-4 py-3 flex items-center justify-between"
      style={{
        backgroundColor: '#fff3e0',
        borderBottom: '1px solid #e65100',
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="px-2 py-0.5 rounded text-[11px] font-medium text-white"
          style={{ backgroundColor: '#e65100' }}
        >
          TRANSAKTION
        </span>
        <span className="text-[13px]" style={{ color: '#1a1a2e' }}>
          {transaction.number}
        </span>
        <span className="text-[12px]" style={{ color: '#555555' }}>
          {transaction.steps.length} Schritt{transaction.steps.length !== 1 ? 'e' : ''}
        </span>
        <span className="text-[12px]" style={{ color: '#555555' }}>
          · {transaction.author}
        </span>
        {isReviewMode && (
          <span
            className="px-2 py-0.5 rounded text-[11px]"
            style={{ backgroundColor: '#fff3e0', color: '#e65100', border: '1px solid #e65100' }}
          >
            Zur Prüfung
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isReviewMode ? (
          <>
            <button
              onClick={onSubmit}
              className="px-3 py-1.5 rounded text-[12px] font-medium text-white"
              style={{ backgroundColor: '#0050a0' }}
            >
              Einreichen zur Prüfung
            </button>
            <button
              onClick={onDiscard}
              className="px-3 py-1.5 rounded text-[12px]"
              style={{ color: '#e65100', border: '1px solid #e65100', backgroundColor: 'transparent' }}
            >
              Transaktion verwerfen
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onSubmit}
              className="px-3 py-1.5 rounded text-[12px] font-medium text-white"
              style={{ backgroundColor: '#2e7d32' }}
            >
              ENTER Alle ausführen
            </button>
            <button
              onClick={onDiscard}
              className="px-3 py-1.5 rounded text-[12px]"
              style={{ color: '#555555', border: '1px solid #b0bec5', backgroundColor: 'transparent' }}
            >
              ESC
            </button>
          </>
        )}
      </div>
    </div>
  );
}
