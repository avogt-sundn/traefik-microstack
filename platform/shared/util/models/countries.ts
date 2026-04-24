/**
 * Available country IDs for address selection
 * Currently only Germany is supported (ID = 0)
 */
export const COUNTRY_IDS = {
  GERMANY: 0,
} as const;

/**
 * Translation keys for countries
 */
export const COUNTRY_TRANSLATION_KEYS = {
  [COUNTRY_IDS.GERMANY]: 'forms.countries.germany',
} as const;
