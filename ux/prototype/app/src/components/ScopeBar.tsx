interface Props {
  userName: string;
}

export function ScopeBar({ userName }: Props) {
  return (
    <header class="scope-bar">
      <div class="scope-bar__tier1">
        <strong>BK Musterstadt</strong>
        <div class="scope-bar__tier1-right">
          <span>{userName}</span>
          <span>&#x1F514;</span>
          <span>&#x2699;</span>
          <span>&#x1F464;</span>
        </div>
      </div>
      <div class="scope-bar__tier2">
        <span>Heimathafen</span>
        <span class="scope-bar__hamburger">&#x2261;</span>
      </div>
      <style>{`
        .scope-bar { flex-shrink: 0; }
        .scope-bar__tier1 {
          height: 40px; background: var(--top-nav); color: var(--top-nav-text);
          display: flex; align-items: center; padding: 0 16px; font-size: 14px;
        }
        .scope-bar__tier1-right {
          margin-left: auto; display: flex; align-items: center; gap: 12px; font-size: 13px;
        }
        .scope-bar__tier2 {
          height: 40px; background: var(--secondary-nav);
          border-bottom: 1px solid var(--secondary-nav-border);
          display: flex; align-items: center; padding: 0 16px;
          font-size: 14px; font-weight: 500; color: var(--text-body);
        }
        .scope-bar__hamburger {
          margin-left: auto; color: var(--text-secondary); font-size: 20px; cursor: pointer;
        }
      `}</style>
    </header>
  );
}
