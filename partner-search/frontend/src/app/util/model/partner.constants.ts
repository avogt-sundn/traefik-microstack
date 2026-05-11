/**
 * Partner-related constants used throughout the application
 */

/**
 * Partner Function IDs
 */
export const PARTNER_FUNCTION_IDS = {
  PARTNER_HAUPTANSCHRIFT: 101,
  PARTNER_ZUSATZANSCHRIFT: 102,
  BETRIEBSSTAETTE: 103,
  VERSANDANSCHRIFT: 104,
  PARTNER_ANSPRECHPARTNER: 105,
  INHABER: 1,
  GESCHAEFTSFUEHRER: 2,
  VORSTAND: 12,
} as const;

/**
 * Address Type IDs
 */
export const ADDRESS_TYPE_IDS = {
  HAUPTANSCHRIFT: 200,
  ZUSATZANSCHRIFT: 201,
  POSTFACHANSCHRIFT: 202,
  VERSANDADRESSE: 203,
  RECHNUNGSANSCHRIFT: 204,
} as const;


/**
 * Telecommunication Type IDs
 */
export const TELKOM_TYPE_IDS = {
  HAUPTNUMMER: 1,
  EMAIL: 6,
  MOBILTELEFON: 7,
  EMAIL_VORANKUENDIGUNG: 9,
} as const;

/**
 * Salutation codes mapping
 * Format prepared for future backend loading
 */
export const SALUTATION_CODES = {
  "1": "Herr",
  "2": "Frau",
} as const;

