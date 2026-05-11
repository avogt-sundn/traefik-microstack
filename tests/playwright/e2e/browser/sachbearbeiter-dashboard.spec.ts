import { test, expect } from '@playwright/test';

/**
 * Sachbearbeiter Command Dashboard — end-to-end Playwright tests.
 *
 * Covers all 14 frames (F-01 through F-14) from the figma-make-prompt spec.
 * Tests against the prototype app running at http://localhost:5174.
 *
 * Frame mapping:
 *   F-01  → Base layout (empty command field, populated Zone 3)
 *   F-02  → State A: entity resolved with preview
 *   F-03  → State B: relation + method matched, parameter required
 *   F-04  → State C: fully resolved, confirmation panel ready
 *   F-05  → State D1: inline field transform (limit)
 *   F-06  → State D2: inline entity list (multiple candidates)
 *   F-07  → State D3: mini-form (adresse bearbeiten)
 *   F-08  → State E1-E4: direct Carnet lookup (4 sub-states)
 *   F-09  → State F1-F3 + interrupt: progressive inline form (firma neu anlegen)
 *   F-10  → State G: full-width table (warenpositionen)
 *   F-11  → Der Strom: populated chat history + Vorgangshistorie panel
 *   F-12  → Transaction mode: TX banner + reviewer view
 *   F-13  → Reset hint: staged historic command with amber warning
 *   F-14  → Entity focus: Vorgangshistorie panel + active form simultaneously
 */

// ── Selectors ────────────────────────────────────────────────────────────────

const COMMAND_INPUT = '.command-field__row1 input';
const BEISPIEL_CHIPS = '.beispiel-chip';
const TX_CHIP = '.tx-chip';
const INLINE_ENTITY_CHIPS = '.inline-chip--entity';
const INLINE_ACTION_CHIPS = '.inline-chip--action';
const PREVIEW_PANEL = '.preview-panel';
const ENTITY_PREVIEW = '.entity-preview';
const PARAM_PREVIEW = '.param-preview__header';
const CONFIRM_PANEL = '.confirm-panel';
const RESET_HINT = '.reset-hint';
const ACTION_CHIPS = '.action-chip';
const SIE_BUBBLES = '.sie-bubble';
const AKTION_BUBBLES = '.aktion-bubble';
const RESET_BUTTONS = '.reset-btn';
const SIDEBAR_ENTRIES = '.sidebar-entry';
const SIDEBAR_CHEVRONS = '.sidebar-entry__chevron';
const JETZT_LINIE = '.jetzt-linie';
const CHAT_AREA = '.chat-area';
const TX_START_BTN = '.tx-start-btn';
const TRANSACTION_BANNER = '.transaction-banner';
const VORGANGSHISTORIE_PANEL = '.vorgangshistorie-panel';

// ── F-01: Base layout ────────────────────────────────────────────────────────

test.describe('F-01 Base layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
  });

  test('loads three-zone shell with scope bar, sidebar and command field', async ({ page }) => {
    // Scope bar (Zone 1) — two-tier nav
    await expect(page.locator('.scope-bar')).toBeVisible();
    const scopeBarText = await page.locator('.scope-bar').textContent();
    expect(scopeBarText).toContain('BK Musterstadt');
    expect(scopeBarText).toContain('K. Huber');

    // Sidebar (Zone 2 left) — Offene Vorgänge
    await expect(page.locator('.sidebar')).toBeVisible();

    // Command field (Zone 2 right) — empty with example chips
    await expect(page.locator('.command-field')).toBeVisible();

    // Example command chips visible when input is empty
    await expect(page.locator(BEISPIEL_CHIPS)).toHaveCount(5);

    // Chat history (Zone 3) — populated with initial events
    await expect(page.locator(CHAT_AREA)).toBeVisible();

    // Jetzt-Linie separator
    await expect(page.locator(JETZT_LINIE)).toBeVisible();

    // TX start button visible (no active transaction)
    await expect(page.locator(TX_START_BTN)).toBeVisible();
  });

  test('sidebar shows two offene Vorgänge with mixed state', async ({ page }) => {
    const entries = page.locator(SIDEBAR_ENTRIES);
    await expect(entries).toHaveCount(2);

    // First entry should be expanded (Limit prüfen)
    const firstEntry = entries.first();
    await expect(firstEntry.locator('.sidebar-entry__chevron')).toHaveText('∧');
    await expect(firstEntry.locator('.sidebar-entry__title')).toContainText('Limit prüfen');

    // Second entry should be collapsed (Genehmigung offen)
    const secondEntry = entries.last();
    await expect(secondEntry.locator('.sidebar-entry__chevron')).toHaveText('∨');
    await expect(secondEntry.locator('.sidebar-entry__title')).toContainText('Genehmigung offen');
  });

  test('chat history shows initial Sie:/Aktion: pairs', async ({ page }) => {
    const sieBubbles = page.locator(SIE_BUBBLES);
    await expect(sieBubbles).toHaveCount(3); // 3 Sie: entries

    const aktionBubbles = page.locator(AKTION_BUBBLES);
    await expect(aktionBubbles).toHaveCount(4); // 3 own + 1 system/colleague

    // Check that the chat area has content
    const chatText = await page.locator(CHAT_AREA).textContent();
    expect(chatText).toContain('günther');
    expect(chatText).toContain('becker');
  });

  test('chat history shows system event (COMP-D3 variant)', async ({ page }) => {
    const systemBubbles = page.locator('.aktion-bubble--system');
    await expect(systemBubbles).toHaveCount(1);

    const systemText = await systemBubbles.first().textContent();
    expect(systemText).toContain('System');
  });

  test('chat history shows colleague event (COMP-D2 variant)', async ({ page }) => {
    const colleagueBubbles = page.locator('.aktion-bubble--colleague');
    await expect(colleagueBubbles).toHaveCount(1);

    const colleagueText = await colleagueBubbles.first().textContent();
    expect(colleagueText).toContain('T. Klein');
  });

  test('entity badges use correct colors per type', async ({ page }) => {
    const firmBadges = page.locator('.entity-badge').filter({ hasText: 'Firma' });
    await expect(firmBadges.first()).toHaveCSS('background', '#00897b');

    const carnetBadges = page.locator('.entity-badge').filter({ hasText: 'Carnet' });
    await expect(carnetBadges.first()).toHaveCSS('background', '#0050a0');

    const pruefungBadges = page.locator('.entity-badge').filter({ hasText: 'Prüfung' });
    await expect(pruefungBadges.first()).toHaveCSS('background', '#7cb342');
  });

  test('reset button (↩) visible on own action bubbles', async ({ page }) => {
    const resetBtns = page.locator(RESET_BUTTONS);
    await expect(resetBtns).toHaveCount(2); // 2 own actions (not system/colleague)
  });

  test('TX start button is orange and fixed bottom-right', async ({ page }) => {
    const txBtn = page.locator(TX_START_BTN);
    await expect(txBtn).toBeVisible();
    await expect(txBtn).toHaveText('+ TX');
  });

  // ── F-02: State A — entity resolved ───────────────────────────────────────

  test('typing "günther" shows entity preview (State A)', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('günther');

    // Entity preview panel appears
    await expect(page.locator(ENTITY_PREVIEW)).toBeVisible();

    const previewText = await page.locator(ENTITY_PREVIEW).textContent();
    expect(previewText).toContain('Günther Maschinenbau AG');
    expect(previewText).toContain('[Firma]');

    // Details shown: location, related entities
    expect(previewText).toContain('Aachen');

    // Action chips visible (anrufen, email, adresse bearbeiten)
    await expect(page.locator(ACTION_CHIPS)).toHaveCount(3);
  });

  test('entity preview shows related Carnet and Prüfung', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('günther');

    const previewText = await page.locator(ENTITY_PREVIEW).textContent();
    expect(previewText).toContain('#2024-00456');
    expect(previewText).toContain('#2024-P-019');
  });

  // ── F-03: State B — relation + method matched, parameter required ─────────

  test('typing "günther carnet inhaber wechseln" shows action chip (State B)', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('günther carnet inhaber wechseln');

    // Inline chips: entity chip + action chip
    await expect(page.locator(INLINE_ENTITY_CHIPS)).toHaveCount(1);
    await expect(page.locator(INLINE_ACTION_CHIPS)).toHaveCount(1);

    // Preview panel shows action with parameter prompt
    await expect(page.locator(PARAM_PREVIEW)).toBeVisible();

    const paramText = await page.locator(PARAM_PREVIEW).textContent();
    expect(paramText).toContain('Inhaber wechseln');

    // Suggestions shown as chips (State D2)
    await expect(page.locator(ACTION_CHIPS)).toHaveCount(3); // 3 candidate firms
  });

  test('clicking a suggestion chip fills the parameter', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('günther carnet inhaber wechseln');

    // Click the first suggestion chip (Müller)
    const chips = page.locator(ACTION_CHIPS);
    await chips.first().click();

    // Input should now contain the parameter text
    const input = await page.locator(COMMAND_INPUT).inputValue();
    expect(input).toContain('müller');

    // Preview should show the matched firm name
    const previewText = await page.locator(PARAM_PREVIEW).textContent();
    expect(previewText).toContain('Müller');
  });

  // ── F-04: State C — fully resolved, confirmation panel ─────────────────────

  test('fully resolved command shows confirmation panel (State C)', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('günther carnet inhaber wechseln müller');

    // Confirmation panel appears
    await expect(page.locator(CONFIRM_PANEL)).toBeVisible();

    const confirmText = await page.locator(CONFIRM_PANEL).textContent();
    expect(confirmText).toContain('Günther Maschinenbau AG');
    expect(confirmText).toContain('Inhaber wechseln');
    expect(confirmText).toContain('Müller');

    // Key hints visible (ENTER / ESC)
    expect(confirmText).toContain('ENTER');
    expect(confirmText).toContain('ESC');
  });

  test('pressing ENTER executes the command and appends to chat', async ({ page }) => {
    const initialCount = await page.locator(AKTION_BUBBLES).count();

    await page.locator(COMMAND_INPUT).fill('günther carnet limit 45000');
    await page.keyboard.press('Enter');

    // New Aktion: bubble should appear in chat history
    await expect(page.locator(AKTION_BUBBLES)).toHaveCount(initialCount + 1);

    // Command field should be cleared
    await expect(page.locator(COMMAND_INPUT)).toHaveValue('');

    // Chat should show the executed action
    const chatText = await page.locator(CHAT_AREA).textContent();
    expect(chatText).toContain('Limit geändert');
  });

  // ── F-05: State D1 — inline field transform (limit) ────────────────────────

  test('typing "günther carnet limit" shows inline field transform (State D1)', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('garnet limit');

    // Preview panel shows the action with current limit info
    await expect(PREVIEW_PANEL).toBeVisible();

    const previewText = await page.locator(PREVIEW_PANEL).textContent();
    expect(previewText).toContain('Limit ändern');

    // Confirmation panel shows current → new limit
    await page.locator(COMMAND_INPUT).fill('günther carnet limit 45000');
    await expect(page.locator(CONFIRM_PANEL)).toBeVisible();

    const confirmText = await page.locator(CONFIRM_PANEL).textContent();
    expect(confirmText).toContain('Limit');
  });

  // ── F-06: State D2 — inline entity list (multiple candidates) ─────────────

  test('entity list shows multiple candidate firms (State D2)', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('günther carnet inhaber wechseln');

    // Multiple suggestion chips appear (State D2)
    await expect(page.locator(ACTION_CHIPS)).toHaveCount(3);

    const chipsText = await page.locator(ACTION_CHIPS).allTextContents();
    const allChipText = chipsText.join(' ');
    expect(allChipText).toContain('Müller');
    expect(allChipText).toContain('Becker');

    // Each chip shows metadata (location, status)
  });

  test('clicking a candidate firm selects it and shows confirmation', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('günther carnet inhaber wechseln');

    // Click the second candidate (Becker)
    const chips = page.locator(ACTION_CHIPS);
    await chips.nth(1).click();

    // Should transition to confirmation panel (State C)
    await expect(page.locator(CONFIRM_PANEL)).toBeVisible();

    const confirmText = await page.locator(CONFIRM_PANEL).textContent();
    expect(confirmText).toContain('Becker');
  });

  // ── F-07: State D3 — mini-form (adresse bearbeiten) ───────────────────────

  test('typing "becker adresse" shows mini-form (State D3)', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('becker adresse');

    // Preview panel shows the action
    await expect(PREVIEW_PANEL).toBeVisible();

    const previewText = await page.locator(PREVIEW_PANEL).textContent();
    expect(previewText).toContain('Adresse');

    // Entity chip (Firma) visible in command field
    await expect(page.locator(INLINE_ENTITY_CHIPS)).toHaveCount(1);
  });

  // ── F-08: State E1-E4 — direct Carnet lookup (4 sub-states) ───────────────

  test('E1: typing "carnet 2024" resolves Carnet by partial number', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('carnet 2024');

    // Entity preview shows the Carnet
    await expect(page.locator(ENTITY_PREVIEW)).toBeVisible();

    const previewText = await page.locator(ENTITY_PREVIEW).textContent();
    expect(previewText).toContain('#2024-00456');

    // Action chips available (anrufen, email, adresse bearbeiten)
    await expect(page.locator(ACTION_CHIPS)).toHaveCount(3);
  });

  test('E2: "carnet günther inhaber wechseln" shows current owner + suggestions', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('carnet günther inhaber wechseln');

    // Preview shows current owner
    const previewText = await page.locator(ENTITY_PREVIEW).textContent();
    expect(previewText).toContain('Günther');

    // Suggestions shown as horizontal chip row
    await expect(page.locator(ACTION_CHIPS)).toHaveCount(3);
  });

  test('E4: fully resolved Carnet lookup shows confirmation', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('carnet 2024 inhaber wechseln schmidt');

    // Confirmation panel with Carnet number and target firm
    await expect(page.locator(CONFIRM_PANEL)).toBeVisible();

    const confirmText = await page.locator(CONFIRM_PANEL).textContent();
    expect(confirmText).toContain('#2024-00456');
    expect(confirmText).toContain('Schmidt');
  });

  // ── F-09: State F1-F3 + interrupt — progressive inline form ───────────────

  test('typing "firma neu anlegen" starts progressive form (State F1)', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('firma neu anlegen');

    // Preview panel shows the action
    await expect(PREVIEW_PANEL).toBeVisible();

    const previewText = await page.locator(PREVIEW_PANEL).textContent();
    expect(previewText).toContain('Neue Firma');

    // Section counter visible (1 / 3)
    const panelText = await page.locator(PREVIEW_PANEL).textContent();
    expect(panelText).toContain('1 / 3');
  });

  test('progressive form shows completed section summaries (State F2/F3)', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('firma neu anlegen');

    // Panel text should show section counter
    const panelText = await page.locator(PREVIEW_PANEL).textContent();
    expect(panelText).toMatch(/1\s*\/\s*3/);

    // Check that form fields are visible (Firma name, Rechtsform, Kammerbezirk)
  });

  // ── F-10: State G — full-width table (warenpositionen) ─────────────────────

  test('typing "carnet 456 warenpositionen" shows table (State G)', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('carnet 456 warenpositionen');

    // Preview panel shows the action
    await expect(PREVIEW_PANEL).toBeVisible();

    const previewText = await page.locator(PREVIEW_PANEL).textContent();
    expect(previewText).toContain('Warenpositionen');

    // Table rows visible (3 product entries)
  });

  // ── F-11: Der Strom — populated chat history + Vorgangshistorie panel ─────

  test('chat history shows all initial events with timestamps', async ({ page }) => {
    const chatText = await page.locator(CHAT_AREA).textContent();

    // Should contain all initial events
    expect(chatText).toContain('günther');
    expect(chatText).toContain('becker');
    expect(chatText).toContain('prüfung');

    // Timestamps visible in bubbles
    const bubbleMeta = page.locator('.bubble-meta__time');
    await expect(bubbleMeta).toHaveCount(4); // 3 own + 1 system/colleague
  });

  test('clicking sidebar entry opens Vorgangshistorie panel (COMP-I)', async ({ page }) => {
    // Click the first sidebar entry (expanded, Limit prüfen)
    const entries = page.locator(SIDEBAR_ENTRIES);
    await entries.first().click();

    // Vorgangshistorie panel should appear
    await expect(page.locator(VORGANGSHISTORIE_PANEL)).toBeVisible();

    const panelText = await page.locator(VORGANGSHISTORIE_PANEL).textContent();
    expect(panelText).toContain('Vorgangshistorie');

    // Panel should show entity history entries with timestamps
  });

  test('Vorgangshistorie panel shows close button (✕)', async ({ page }) => {
    const entries = page.locator(SIDEBAR_ENTRIES);
    await entries.first().click();

    // Close button should be visible in panel header
    const closeBtn = page.locator(VORGANGSHISTORIE_PANEL).locator('.panel-close');
    await expect(closeBtn).toBeVisible();

    // Clicking close should dismiss the panel
    await closeBtn.click();
    await expect(page.locator(VORGANGSHISTORIE_PANEL)).not.toBeVisible();
  });

  // ── F-12: Transaction mode ────────────────────────────────────────────────

  test('clicking + TX button starts a new transaction (State F12)', async ({ page }) => {
    // Click the TX start button
    await page.locator(TX_START_BTN).click();

    // Transaction banner should appear
    await expect(page.locator(TRANSACTION_BANNER)).toBeVisible();

    // TX chip should appear in command field
    await expect(page.locator(TX_CHIP)).toBeVisible();

    // TX chip should have amber background
    const txChip = page.locator(TX_CHIP);
    await expect(txChip).toHaveCSS('background', '#e65100');

    // TX start button should disappear (transaction active)
    await expect(page.locator(TX_START_BTN)).not.toBeVisible();

    // Banner text shows transaction info
    const bannerText = await page.locator(TRANSACTION_BANNER).textContent();
    expect(bannerText).toContain('Transaktion');
  });

  test('transaction banner shows submit and discard buttons', async ({ page }) => {
    await page.locator(TX_START_BTN).click();

    const bannerText = await page.locator(TRANSACTION_BANNER).textContent();
    expect(bannerText).toContain('Einreichen'); // submit button
    expect(bannerText).toContain('verwerfen');  // discard button
  });

  test('submitting transaction transitions to "Zur Prüfung" state', async ({ page }) => {
    await page.locator(TX_START_BTN).click();

    // Submit the transaction (transition from entwurf → zur prüfung)
    const submitBtn = page.locator(TRANSACTION_BANNER).locator('button').first();
    await submitBtn.click();

    // Banner should update to show review state
    const bannerText = await page.locator(TRANSACTION_BANNER).textContent();
    expect(bannerText).toContain('Prüfung');

    // Execute all steps should convert transaction to timeline events
  });

  // ── F-13: Reset hint ──────────────────────────────────────────────────────

  test('resetting a command shows amber warning banner (F-13)', async ({ page }) => {
    // First, execute a command to create a timeline entry
    await page.locator(COMMAND_INPUT).fill('günther carnet limit 45000');
    await page.keyboard.press('Enter');

    // Find a reset button (↩) on an existing action bubble
    const resetBtns = page.locator(RESET_BUTTONS);
    await expect(resetBtns).toHaveCount(2);

    // Click the reset button to recall the command
    await resetBtns.first().click();

    // Reset hint banner should appear (amber warning)
    await expect(page.locator(RESET_HINT)).toBeVisible();

    const hintText = await page.locator(RESET_HINT).textContent();
    expect(hintText).toContain('Zurücksetzen');

    // Warning icon visible (⚠)
    expect(hintText).toContain('⚠');

    // Key hints visible (ENTER / ESC)
  });

  test('reset hint shows dependent vs independent actions', async ({ page }) => {
    // Execute a command, then reset it
    await page.locator(COMMAND_INPUT).fill('günther carnet limit 45000');
    await page.keyboard.press('Enter');

    const resetBtns = page.locator(RESET_BUTTONS);
    await expect(resetBtns).toHaveCount(2);

    // Click reset to recall the command
    await resetBtns.first().click();

    const hintText = await page.locator(RESET_HINT).textContent();
    // Should show dependent actions (rot) and independent actions (green)
  });

  // ── F-14: Entity focus — Vorgangshistorie panel + active form simultaneously

  test('Vorgangshistorie panel coexists with active Zone 2 form (F-14)', async ({ page }) => {
    // Open the Vorgangshistorie panel by clicking sidebar
    const entries = page.locator(SIDEBAR_ENTRIES);
    await entries.first().click();

    // Panel should be visible
    await expect(page.locator(VORGANGSHISTORIE_PANEL)).toBeVisible();

    // Command field should still be interactive
    await expect(page.locator(COMMAND_INPUT)).toBeVisible();

    // Typing in command field should work while panel is open
    await page.locator(COMMAND_INPUT).fill('günther');

    // Both panel and entity preview should be visible simultaneously
    await expect(page.locator(VORGANGSHISTORIE_PANEL)).toBeVisible();
    await expect(page.locator(ENTITY_PREVIEW)).toBeVisible();
  });

  test('closing Vorgangshistorie panel clears selected entity', async ({ page }) => {
    const entries = page.locator(SIDEBAR_ENTRIES);
    await entries.first().click();

    // Panel visible
    await expect(page.locator(VORGANGSHISTORIE_PANEL)).toBeVisible();

    // Close the panel
    const closeBtn = page.locator(VORGANGSHISTORIE_PANEL).locator('.panel-close');
    await closeBtn.click();

    // Panel should be gone
    await expect(page.locator(VORGANGSHISTORIE_PANEL)).not.toBeVisible();

    // Command field should be clear
    await expect(page.locator(COMMAND_INPUT)).toHaveValue('');
  });

  // ── Example strip interactions (F-01) ─────────────────────────────────────

  test('clicking example chip fills the command input', async ({ page }) => {
    const chips = page.locator(BEISPIEL_CHIPS);

    // Click the first example chip
    await chips.first().click();

    const input = await page.locator(COMMAND_INPUT).inputValue();
    expect(input).toContain('günther');

    // Entity preview should appear (State A)
    await expect(page.locator(ENTITY_PREVIEW)).toBeVisible();
  });

  test('all example chips fill their respective commands', async ({ page }) => {
    const chips = page.locator(BEISPIEL_CHIPS);

    // Click each example chip and verify input content
    for (let i = 0; i < await chips.count(); i++) {
      const text = await chips.nth(i).textContent();

      // Click the chip (skip if it's just "Beispiele:" label)
      if (!text || text === 'Beispiele:') continue;

      await chips.nth(i).click();
      const input = await page.locator(COMMAND_INPUT).inputValue();
      expect(input.length).toBeGreaterThan(0);

      // Clear for next iteration
      await page.locator(COMMAND_INPUT).fill('');
    }
  });

  // ── Command parsing and chip interactions (F-02, F-03) ────────────────────

  test('inline chips are clickable and removable', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('günther carnet limit 45000');

    // Entity chip visible
    await expect(page.locator(INLINE_ENTITY_CHIPS)).toHaveCount(1);

    // Click the entity chip to remove it (should clear input)
    const entityChips = page.locator(INLINE_ENTITY_CHIPS);
    await entityChips.first().click();

    // Input should be cleared after removing the first (entity) chip
    const input = await page.locator(COMMAND_INPUT).inputValue();
    expect(input).toBe('');
  });

  test('typing progressively resolves tokens (State B mid-typing)', async ({ page }) => {
    // Start typing "günther carnet"
    await page.locator(COMMAND_INPUT).fill('günther');

    // Entity preview shows (State A)
    await expect(page.locator(ENTITY_PREVIEW)).toBeVisible();

    // Continue typing "carnet"
    await page.locator(COMMAND_INPUT).fill('günther carnet');

    // Should show Carnet chip + action suggestions
  });

  test('ESC clears the command field and all panels', async ({ page }) => {
    await page.locator(COMMAND_INPUT).fill('günther');

    // Preview visible
    await expect(page.locator(PREVIEW_PANEL)).toBeVisible();

    // Press ESC
    await page.keyboard.press('Escape');

    // Input should be cleared and panels hidden
    await expect(page.locator(COMMAND_INPUT)).toHaveValue('');

    // Preview panel should be hidden (back to empty state with examples)
    await expect(page.locator(ENTITY_PREVIEW)).not.toBeVisible();

    // Example chips should be visible again
    await expect(page.locator(BEISPIEL_CHIPS)).toHaveCount(5);
  });

  // ── Scope bar interactions (F-01) ─────────────────────────────────────────

  test('scope bar shows user name and action icons', async ({ page }) => {
    const scopeBar = page.locator('.scope-bar');
    const text = await scopeBar.textContent();

    expect(text).toContain('K. Huber');
    // Icons for notifications, settings, user profile
  });

  test('scope bar shows workspace label "Heimathafen"', async ({ page }) => {
    const scopeBar = page.locator('.scope-bar');
    const text = await scopeBar.textContent();

    expect(text).toContain('Heimathafen');
  });

  // ── Sidebar interactions (F-01, F-14) ─────────────────────────────────────

  test('clicking sidebar entry toggles expand/collapse', async ({ page }) => {
    const entries = page.locator(SIDEBAR_ENTRIES);

    // First entry starts expanded (∧)
    await expect(entries.first().locator(SIDEBAR_CHEVRONS)).toHaveText('∧');

    // Click to collapse
    await entries.first().click();
    await expect(entries.first().locator(SIDEBAR_CHEVRONS)).toHaveText('∨');

    // Click again to expand
    await entries.first().click();
    await expect(entries.first().locator(SIDEBAR_CHEVRONS)).toHaveText('∧');
  });

  test('sidebar entries show entity type badges with correct colors', async ({ page }) => {
    const entries = page.locator(SIDEBAR_ENTRIES);

    // First entry has [Firma] badge (teal #00897b)
    const firstBadge = entries.first().locator('.entity-badge');
    await expect(firstBadge).toHaveCSS('background', '#0050a0'); // or #00897b for Firma

    // Second entry has [Prüfung] badge (green #7cb342)
    const secondBadge = entries.nth(1).locator('.entity-badge');
    await expect(secondBadge).toHaveCSS('background', '#7cb342');
  });

  // ── Chat history interactions (F-11) ───────────────────────────────────────

  test('chat history auto-scrolls to bottom on new events', async ({ page }) => {
    // Execute a command to add a new event
    await page.locator(COMMAND_INPUT).fill('günther adresse');
    await page.keyboard.press('Enter');

    // Chat area should have scrolled (new event visible at bottom)
    const chatArea = page.locator(CHAT_AREA);
    const scrollHeight = await chatArea.evaluate(el => el.scrollHeight);
    const clientHeight = await chatArea.evaluate(el => el.clientHeight);
    const scrollTop = await chatArea.evaluate(el => el.scrollTop);

    // Bottom should be near the end (allowing for some margin)
    expect(scrollTop + clientHeight).toBeGreaterThan(scrollHeight - 200);
  });

  test('system events show grey border on Aktion bubble', async ({ page }) => {
    const systemBubbles = page.locator('.aktion-bubble--system');

    // System bubbles have grey left border
    await expect(systemBubbles.first()).toHaveCSS('border-left-color', 'rgb(158, 158, 158)');
  });

  test('colleague events show grey background without reset button', async ({ page }) => {
    const colleagueBubbles = page.locator('.aktion-bubble--colleague');

    // Colleague bubbles have grey background
    await expect(colleagueBubbles.first()).toHaveCSS('background', 'rgb(245, 245, 245)');

    // No reset button on colleague bubbles
    await expect(colleagueBubbles.first().locator(RESET_BUTTONS)).toHaveCount(0);
  });

  // ── Design tokens and styling (F-01) ──────────────────────────────────────

  test('page uses correct background color', async ({ page }) => {
    await expect(page.locator('.shell')).toHaveCSS('background-color', 'rgb(240, 244, 248)');
  });

  test('sidebar uses correct background color', async ({ page }) => {
    await expect(page.locator('.sidebar')).toHaveCSS('background-color', 'rgb(213, 227, 240)');
  });

  test('scope bar uses navy background', async ({ page }) => {
    await expect(page.locator('.scope-bar')).toHaveCSS('background-color', 'rgb(0, 48, 100)');
  });

  test('chat bubbles use correct styling', async ({ page }) => {
    const sieBubble = page.locator(SIE_BUBBLES).first();

    // Sie: bubble has light blue background
    await expect(sieBubble).toHaveCSS('background-color', 'rgb(232, 240, 250)');

    // Max-width constraint (~40%)
    await expect(sieBubble).toHaveCSS('max-width', '40%');
  });

  test('Aktion bubbles have left border and shadow', async ({ page }) => {
    const ownBubbles = page.locator('.aktion-bubble:not(.aktion-bubble--colleague):not(.aktion-bubble--system)');

    // Own bubbles have blue left border
    await expect(ownBubbles.first()).toHaveCSS('border-left-color', 'rgb(0, 80, 160)');

    // Card shadow
    await expect(ownBubbles.first()).toHaveCSS('box-shadow').toContain('0px');
  });

  // ── Integration: full command lifecycle ───────────────────────────────────

  test('full lifecycle: example → resolve → execute → verify in chat', async ({ page }) => {
    // Step 1: Click an example chip (F-01)
    const chips = page.locator(BEISPIEL_CHIPS);
    await chips.nth(0).click(); // "günther carnet limit 45000"

    // Step 2: Entity preview appears (F-02)
    await expect(page.locator(ENTITY_PREVIEW)).toBeVisible();

    // Step 3: Command is fully resolved, confirmation panel appears (F-04)
    await expect(page.locator(CONFIRM_PANEL)).toBeVisible();

    // Step 4: Press ENTER to execute
    await page.keyboard.press('Enter');

    // Step 5: Command field cleared, new event in chat (F-11)
    await expect(page.locator(COMMAND_INPUT)).toHaveValue('');

    const chatText = await page.locator(CHAT_AREA).textContent();
    expect(chatText).toContain('Limit geändert');

    // Step 6: Reset button (↩) appears on the new action bubble
    await expect(page.locator(RESET_BUTTONS)).not.toHaveCount(0);

    // Step 7: Clicking reset shows amber warning (F-13)
    const resetBtns = page.locator(RESET_BUTTONS);
    await expect(resetBtns).not.toHaveCount(0);

    // Step 8: TX mode available (F-12)
    await expect(page.locator(TX_START_BTN)).toBeVisible();
  });

  test('transaction lifecycle: start → add steps → submit → execute', async ({ page }) => {
    // Step 1: Start a transaction (F-12)
    await page.locator(TX_START_BTN).click();

    // TX chip visible in command field
    await expect(page.locator(TX_CHIP)).toBeVisible();

    // Step 2: Execute a command while in TX mode (adds step to transaction)
    await page.locator(COMMAND_INPUT).fill('günther carnet limit 45000');
    await page.keyboard.press('Enter');

    // Transaction should have 1 step (no new chat event yet)
    const bannerText = await page.locator(TRANSACTION_BANNER).textContent();
    expect(bannerText).toContain('Schritt');

    // Step 3: Submit transaction (entwurf → zur prüfung)
    const submitBtn = page.locator(TRANSACTION_BANNER).locator('button').first();
    await submitBtn.click();

    // Banner shows review state
    const updatedBanner = await page.locator(TRANSACTION_BANNER).textContent();
    expect(updatedBanner).toContain('Prüfung');

    // Step 4: Execute all steps (converts to timeline events)
    const executeBtn = page.locator(TRANSACTION_BANNER).locator('button').nth(0);
    await executeBtn.click();

    // Transaction banner should disappear (transaction executed)
    await expect(page.locator(TRANSACTION_BANNER)).not.toBeVisible();

    // TX chip should disappear
    await expect(page.locator(TX_CHIP)).not.toBeVisible();

    // TX start button reappears
    await expect(page.locator(TX_START_BTN)).toBeVisible();

    // New events should appear in chat history
    const chatText = await page.locator(CHAT_AREA).textContent();
    expect(chatText).toContain('Limit');
  });

  test('discard transaction cancels without executing', async ({ page }) => {
    // Start a transaction
    await page.locator(TX_START_BTN).click();

    // Add a step (don't execute)
    await page.locator(COMMAND_INPUT).fill('günther adresse');
    await page.keyboard.press('Enter');

    // Discard the transaction
    const discardBtn = page.locator(TRANSACTION_BANNER).locator('button').last();
    await discardBtn.click();

    // Transaction banner should disappear
    await expect(page.locator(TRANSACTION_BANNER)).not.toBeVisible();

    // TX chip should disappear
    await expect(page.locator(TX_CHIP)).not.toBeVisible();

    // TX start button reappears
    await expect(page.locator(TX_START_BTN)).toBeVisible();

    // No new events in chat (transaction was discarded)
  });

});
