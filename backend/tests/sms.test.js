/**
 * SMS Service Tests
 * Tests for Philippine phone validation and SMS functionality
 */

const {
  validatePhoneNumber,
  formatPhoneNumber,
  formatInternational,
  getTelco,
  PH_TELCO_PREFIXES,
  ALL_VALID_PREFIXES,
} = require('../src/services/smsService');

describe('SMS Service - Phone Number Validation', () => {
  describe('formatPhoneNumber', () => {
    it('should format standard 09 format correctly', () => {
      expect(formatPhoneNumber('09171234567')).toBe('09171234567');
    });

    it('should format +63 format correctly', () => {
      expect(formatPhoneNumber('+639171234567')).toBe('09171234567');
    });

    it('should format 63 format correctly', () => {
      expect(formatPhoneNumber('639171234567')).toBe('09171234567');
    });

    it('should format 9XXXXXXXXX format correctly', () => {
      expect(formatPhoneNumber('9171234567')).toBe('09171234567');
    });

    it('should remove non-digit characters', () => {
      expect(formatPhoneNumber('0917-123-4567')).toBe('09171234567');
      expect(formatPhoneNumber('(0917) 123 4567')).toBe('09171234567');
    });

    it('should return null for empty input', () => {
      expect(formatPhoneNumber(null)).toBeNull();
      expect(formatPhoneNumber(undefined)).toBeNull();
    });
  });

  describe('formatInternational', () => {
    it('should convert to international format', () => {
      expect(formatInternational('09171234567')).toBe('639171234567');
    });

    it('should handle +63 input', () => {
      expect(formatInternational('+639171234567')).toBe('639171234567');
    });

    it('should return null for invalid length', () => {
      expect(formatInternational('0917123456')).toBeNull(); // 10 digits
      expect(formatInternational('091712345678')).toBeNull(); // 12 digits
    });
  });

  describe('validatePhoneNumber', () => {
    // Valid Globe numbers
    it('should validate Globe numbers', () => {
      const result = validatePhoneNumber('09171234567');
      expect(result.valid).toBe(true);
      expect(result.telco).toBe('GLOBE');
    });

    it('should validate Globe 0927 prefix', () => {
      const result = validatePhoneNumber('09271234567');
      expect(result.valid).toBe(true);
      expect(result.telco).toBe('GLOBE');
    });

    // Valid Smart numbers
    it('should validate Smart numbers', () => {
      const result = validatePhoneNumber('09181234567');
      expect(result.valid).toBe(true);
      expect(result.telco).toBe('SMART');
    });

    it('should validate Smart 0919 prefix', () => {
      const result = validatePhoneNumber('09191234567');
      expect(result.valid).toBe(true);
      expect(result.telco).toBe('SMART');
    });

    // Smart network includes TNT prefixes
    it('should validate TNT prefixes (under Smart)', () => {
      const result = validatePhoneNumber('09071234567');
      expect(result.valid).toBe(true);
      expect(result.telco).toBe('SMART');
    });

    // Smart network includes Sun prefixes
    it('should validate Sun prefixes (under Smart)', () => {
      const result = validatePhoneNumber('09221234567');
      expect(result.valid).toBe(true);
      expect(result.telco).toBe('SMART');
    });

    // Valid DITO numbers
    it('should validate DITO numbers', () => {
      const result = validatePhoneNumber('09911234567');
      expect(result.valid).toBe(true);
      expect(result.telco).toBe('DITO');
    });

    it('should validate DITO 0993 prefix', () => {
      const result = validatePhoneNumber('09931234567');
      expect(result.valid).toBe(true);
      expect(result.telco).toBe('DITO');
    });

    // Invalid numbers
    it('should reject empty phone numbers', () => {
      const result = validatePhoneNumber('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject phone numbers with wrong length', () => {
      const result = validatePhoneNumber('0917123456'); // 10 digits
      expect(result.valid).toBe(false);
      expect(result.error).toContain('11 digits');
    });

    it('should reject phone numbers not starting with 09', () => {
      const result = validatePhoneNumber('08171234567');
      expect(result.valid).toBe(false);
    });

    // Unrecognized but valid format
    it('should accept unrecognized prefixes with warning', () => {
      // Using a hypothetical unrecognized prefix that starts with 09
      const result = validatePhoneNumber('09001234567');
      expect(result.valid).toBe(true);
      expect(result.telco).toBe('UNKNOWN');
      expect(result.warning).toBeDefined();
    });
  });

  describe('getTelco', () => {
    it('should return correct telco for Globe', () => {
      expect(getTelco('09171234567')).toBe('GLOBE');
      expect(getTelco('09271234567')).toBe('GLOBE');
      expect(getTelco('09771234567')).toBe('GLOBE');
      expect(getTelco('09951234567')).toBe('GLOBE');
    });

    it('should return correct telco for Smart (includes TNT/Sun)', () => {
      expect(getTelco('09181234567')).toBe('SMART');
      expect(getTelco('09191234567')).toBe('SMART');
      expect(getTelco('09201234567')).toBe('SMART');
      expect(getTelco('09071234567')).toBe('SMART'); // TNT prefix
      expect(getTelco('09221234567')).toBe('SMART'); // Sun prefix
    });

    it('should return correct telco for DITO', () => {
      expect(getTelco('09911234567')).toBe('DITO');
      expect(getTelco('09931234567')).toBe('DITO');
    });

    it('should return null for invalid numbers', () => {
      expect(getTelco('')).toBeNull();
      expect(getTelco('invalid')).toBeNull();
    });
  });

  describe('PH_TELCO_PREFIXES', () => {
    it('should have all major networks', () => {
      expect(PH_TELCO_PREFIXES.GLOBE).toBeDefined();
      expect(PH_TELCO_PREFIXES.SMART).toBeDefined();
      expect(PH_TELCO_PREFIXES.DITO).toBeDefined();
    });

    it('should have valid prefix format', () => {
      ALL_VALID_PREFIXES.forEach(prefix => {
        expect(prefix).toMatch(/^09\d{2}$/);
        expect(prefix.length).toBe(4);
      });
    });

    it('should include DITO prefixes', () => {
      expect(PH_TELCO_PREFIXES.DITO).toContain('0991');
      expect(PH_TELCO_PREFIXES.DITO).toContain('0993');
    });

    it('should have Globe prefixes', () => {
      expect(PH_TELCO_PREFIXES.GLOBE).toContain('0917');
      expect(PH_TELCO_PREFIXES.GLOBE).toContain('0927');
      expect(PH_TELCO_PREFIXES.GLOBE).toContain('0977');
    });

    it('should have Smart prefixes (including TNT/Sun)', () => {
      expect(PH_TELCO_PREFIXES.SMART).toContain('0918');
      expect(PH_TELCO_PREFIXES.SMART).toContain('0919');
      expect(PH_TELCO_PREFIXES.SMART).toContain('0907'); // TNT
      expect(PH_TELCO_PREFIXES.SMART).toContain('0922'); // Sun
    });
  });
});

describe('SMS Service - Templates', () => {
  const { SMS_TEMPLATES, formatItemsSummary, formatAmount } = require('../src/services/smsService');

  const mockItems = [
    { product: { name: 'Portland Cement' }, quantity: 2 },
    { product: { name: 'Common Nails 2"' }, quantity: 5 },
    { product: { name: 'GI Wire' }, quantity: 1 },
  ];

  describe('formatItemsSummary', () => {
    it('should format items into compact string', () => {
      const result = formatItemsSummary(mockItems);
      expect(result).toContain('Portland Cement x2');
      expect(result).toContain('Common Nails 2" x5');
    });

    it('should return empty string for no items', () => {
      expect(formatItemsSummary([])).toBe('');
      expect(formatItemsSummary(null)).toBe('');
    });

    it('should truncate long product names', () => {
      const longItems = [{ product: { name: 'Very Long Product Name Here' }, quantity: 1 }];
      const result = formatItemsSummary(longItems);
      expect(result.length).toBeLessThan(30);
      expect(result).toContain('x1');
    });

    it('should add +N more when items exceed max length', () => {
      const manyItems = Array.from({ length: 10 }, (_, i) => ({
        product: { name: `Product ${i + 1}` },
        quantity: i + 1,
      }));
      const result = formatItemsSummary(manyItems, 30);
      expect(result).toContain('+');
      expect(result).toContain('more');
    });
  });

  describe('formatAmount', () => {
    it('should format amounts with commas', () => {
      expect(formatAmount(1500)).toBe('1,500.00');
      expect(formatAmount(100)).toBe('100.00');
    });
  });

  it('should generate order confirmation with items', () => {
    const msg = SMS_TEMPLATES.ORDER_CONFIRMATION('HW-001', 1500.50, 'Test Store', mockItems);
    expect(msg).toContain('HW-001');
    expect(msg).toContain('1,500.50');
    expect(msg).toContain('Order Received');
    expect(msg).toContain('Portland Cement x2');
  });

  it('should generate accepted message with items and amount', () => {
    const msg = SMS_TEMPLATES.ORDER_ACCEPTED('HW-001', 'Test Store', mockItems, 1500.50);
    expect(msg).toContain('HW-001');
    expect(msg).toContain('ACCEPTED');
    expect(msg).toContain('1,500.50');
    expect(msg).toContain('Portland Cement x2');
  });

  it('should generate delivery message with amount', () => {
    const msg = SMS_TEMPLATES.ORDER_OUT_FOR_DELIVERY('HW-001', 1500.50, 'Test Store');
    expect(msg).toContain('HW-001');
    expect(msg).toContain('ON THE WAY');
    expect(msg).toContain('1,500.50');
    expect(msg).toContain('COD');
  });

  it('should generate delivered message with amount', () => {
    const msg = SMS_TEMPLATES.ORDER_DELIVERED('HW-001', 'Test Store', 1500.50);
    expect(msg).toContain('DELIVERED');
    expect(msg).toContain('1,500.50');
  });

  it('should generate admin notification', () => {
    const msg = SMS_TEMPLATES.ADMIN_NEW_ORDER('HW-001', 1500.50, 'Juan');
    expect(msg).toContain('HW-001');
    expect(msg).toContain('1,500.50');
    expect(msg).toContain('Juan');
    expect(msg).toContain('New Order');
  });
});
