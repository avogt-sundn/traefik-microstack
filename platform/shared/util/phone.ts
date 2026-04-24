/**
 * Utility functions for phone number handling
 */
export class Phone {
  /**
   * Parse phone prefix into country and area codes
   * @param prefix - The phone prefix string (e.g., "+49 30" or "+49" or "30")
   * @returns Object with separated country and area codes
   */
  static parsePhonePrefix(prefix: string): { countryCode: string, areaCode: string } {
    if (!prefix) return { countryCode: '', areaCode: '' };

    const parts = prefix.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return { countryCode: parts[0], areaCode: parts[1] };
    } else if (parts.length === 1) {
      return parts[0].startsWith('+')
        ? { countryCode: parts[0], areaCode: '' }
        : { countryCode: '', areaCode: parts[0] };
    }

    return { countryCode: '', areaCode: '' };
  }

  /**
   * Parse complete phone number into country code, area code, and phone number
   * @param fullNumber - The complete phone number (e.g., "+49 30 12345678" or "12345678")
   * @returns Object with separated country code, area code, and phone number
   */
  static parseFullPhoneNumber(fullNumber: string): { countryCode: string, areaCode: string, phoneNumber: string } {
    if (!fullNumber) return {countryCode: '', areaCode: '', phoneNumber: ''};

    // Split by spaces
    const parts = fullNumber.trim().split(/\s+/).filter(p => p.length > 0);

    if (parts.length >= 3) {
      // Format: "+49 30 12345678"
      return {
        countryCode: parts[0],
        areaCode: parts[1],
        phoneNumber: parts.slice(2).join(''),
      };
    } else if (parts.length === 2) {
      // Format: "+49 12345678" or "30 12345678"
      return parts[0].startsWith('+')
        ? {countryCode: parts[0], areaCode: '', phoneNumber: parts[1]}
        : {countryCode: '', areaCode: parts[0], phoneNumber: parts[1]};
    } else if (parts.length === 1) {
      // Format: "12345678" (just phone number)
      return {countryCode: '', areaCode: '', phoneNumber: parts[0]};
    }

    return {countryCode: '', areaCode: '', phoneNumber: ''};
  }

  /**
   * Format phone prefix from country and area codes
   * @param countryCode - The country code (e.g., "+49")
   * @param areaCode - The area code (e.g., "30")
   * @returns Formatted prefix string
   */
  static formatPhonePrefix(countryCode?: string, areaCode?: string): string {
    const country = countryCode || '';
    const area = areaCode || '';
    return country && area ? `${country} ${area}` : country || area;
  }

  /**
   * Format complete phone number from parts
   * @param countryCode - The country code (e.g., "+49")
   * @param areaCode - The area code (e.g., "30")
   * @param phoneNumber - The phone number (e.g., "12345678")
   * @returns Formatted phone number string with space-separated parts
   */
  static formatPhoneNumber(countryCode?: string, areaCode?: string, phoneNumber?: string): string {
    const parts = [
      countryCode,
      areaCode,
      phoneNumber,
    ].filter(part => part && part.trim());
    return parts.join(' ');
  }
}
