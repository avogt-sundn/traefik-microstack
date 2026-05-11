/**
 * Shared selector constants for the Angular micro-frontend UI tests.
 *
 * Angular components carry `cypressid` attributes, selected via:
 *   page.locator('[cypressid="cypress-partner-search-input"]')
 *
 * Keep this file in sync with the Angular template attribute names.
 */
export const Selectors = {
  // ── partner-search MFE ────────────────────────────────────────────────

  /** Free-text token input in the partner search panel. */
  partnerSearchInput: '[cypressid="cypress-partner-search-input"]',

  /** Reset button that clears input, chips, and result table. */
  partnerSearchReset: '[cypressid="cypress-partner-search-reset"]',

  /** "Create new partner" action button. */
  partnerCreateNew: '[cypressid="cypress-partner-create-new"]',

  /** Angular Material result row in the search result table. */
  matRow: 'tr[mat-row], mat-row',

  /** "Keine Ergebnisse" empty-state indicator shown when no partners match. */
  noResults: 'text=Keine Ergebnisse',

  /** Angular Material autocomplete option in a completion dropdown. */
  matOption: 'mat-option',

  /** Partner search host element rendered by the partner remote MFE. */
  partnerSearchHost: 'partner-partner-search',

  // ── partner-edit MFE ──────────────────────────────────────────────────

  /** The tab group shown on the ViewPartner detail page. */
  editPartnerTabGroup: '[cypressid="cypress-edit-partner-tab-group"]',

  /**
   * "Bearbeiten" (Edit) button — visible in view mode.
   * Clicking this enables edit mode and shows the save/cancel pair.
   */
  partnerEditButton: '[cypressid="cypress-partner-create-edit"]',

  /** "Speichern" (Save) button — visible in edit mode only. */
  partnerSaveButton: '[cypressid="cypress-partner-create-save"]',

  /** "Abbrechen" (Cancel) button — visible in edit mode only. */
  partnerCancelButton: '[cypressid="cypress-partner-view-cancel"]',

  /** "Schließen" (Close) button — visible in view mode only. */
  partnerCloseButton: '[cypressid="cypress-partner-view-close"]',
} as const;
