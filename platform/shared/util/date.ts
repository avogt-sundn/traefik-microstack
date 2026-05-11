/**
 * Shared date utility functions for consistent date formatting across the application
 */

/**
 * Format date string to DD.MM.YYYY format
 * @param dateString - Date string or null/undefined
 * @returns Formatted date string or empty string if invalid
 */
export function formatDateToDDMMYYYY(dateString: string | null | undefined): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  } catch {
    return dateString || '';
  }
}

/**
 * Parse date from DD.MM.YYYY format to ISO format (YYYY-MM-DD)
 * @param dateString - Date string in DD.MM.YYYY format or ISO format
 * @returns ISO formatted date string (YYYY-MM-DD) or undefined if invalid
 */
export function parseDateToISO(dateString: string | null | undefined): string | undefined {
  if (!dateString) return undefined;

  if (isCorrectISODateFormat(dateString)) return dateString;

  // Parse German format (DD.MM.YYYY or D.M.YYYY)
  const parts = dateString.split('.');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    const isoDate = `${year}-${month}-${day}`;

    if (isCorrectISODateFormat(isoDate)) return isoDate;
  }
  return undefined;
}

function isCorrectISODateFormat(dateString: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
  return false;
}
