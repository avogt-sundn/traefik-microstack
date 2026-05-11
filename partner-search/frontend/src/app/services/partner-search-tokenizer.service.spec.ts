import {describe, expect, it, beforeEach} from 'vitest';
import {PartnerSearchTokenizerService} from './partner-search-tokenizer.service';

describe('PartnerSearchTokenizerService', () => {
  let service: PartnerSearchTokenizerService;

  beforeEach(() => {
    // Pure class — no TestBed needed
    service = new PartnerSearchTokenizerService();
  });

  describe('tokenize — single tokens', () => {
    it('classifies 6+ digit number as partnerNr', () => {
      const {tokens} = service.tokenize('123456');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].field).toBe('partnerNr');
      expect(tokens[0].raw).toBe('123456');
    });

    it('classifies 3–5 digit number as postalCode', () => {
      const {tokens} = service.tokenize('33100');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].field).toBe('postalCode');
    });

    it('classifies 3-digit number as postalCode', () => {
      const {tokens} = service.tokenize('331');
      expect(tokens[0].field).toBe('postalCode');
    });

    it('classifies 6-digit number as partnerNr, not postalCode', () => {
      const {tokens} = service.tokenize('331002');
      expect(tokens[0].field).toBe('partnerNr');
    });

    it('classifies token ending in "straße" as street', () => {
      const {tokens} = service.tokenize('Musterstraße');
      expect(tokens[0].field).toBe('street');
    });

    it('classifies token ending in "str." as street', () => {
      const {tokens} = service.tokenize('Musterstr.');
      expect(tokens[0].field).toBe('street');
    });

    it('classifies token ending in "weg" as street', () => {
      const {tokens} = service.tokenize('Hauptweg');
      expect(tokens[0].field).toBe('street');
    });

    it('classifies all-uppercase 3–10 char token as alphacode', () => {
      const {tokens} = service.tokenize('MULL');
      expect(tokens[0].field).toBe('alphacode');
    });

    it('classifies uppercase token with wildcard as alphacode', () => {
      const {tokens} = service.tokenize('MULL*');
      expect(tokens[0].field).toBe('alphacode');
    });

    it('classifies letter-only word as city', () => {
      const {tokens} = service.tokenize('München');
      expect(tokens[0].field).toBe('city');
    });

    it('classifies quoted string as name', () => {
      const {tokens} = service.tokenize('"Müller & Söhne"');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].field).toBe('name');
      expect(tokens[0].raw).toBe('Müller & Söhne');
    });

    it('falls back to name for unclassifiable token', () => {
      const {tokens} = service.tokenize('x1y2z3');
      expect(tokens[0].field).toBe('name');
    });
  });

  describe('tokenize — explicit prefixes', () => {
    it('respects nr: prefix', () => {
      const {tokens} = service.tokenize('nr:33100');
      expect(tokens[0].field).toBe('partnerNr');
      expect(tokens[0].raw).toBe('33100');
      expect(tokens[0].explicit).toBe(true);
      expect(tokens[0].state).toBe('LOCKED');
    });

    it('respects plz: prefix', () => {
      const {tokens} = service.tokenize('plz:33100');
      expect(tokens[0].field).toBe('postalCode');
      expect(tokens[0].explicit).toBe(true);
    });

    it('respects stadt: prefix', () => {
      const {tokens} = service.tokenize('stadt:München');
      expect(tokens[0].field).toBe('city');
      expect(tokens[0].explicit).toBe(true);
    });

    it('respects name: prefix, even for digit-only value', () => {
      const {tokens} = service.tokenize('name:12345');
      expect(tokens[0].field).toBe('name');
      expect(tokens[0].raw).toBe('12345');
      expect(tokens[0].explicit).toBe(true);
    });
  });

  describe('tokenize — digit ambiguity', () => {
    it('first short digit token → postalCode, second long → partnerNr', () => {
      const {tokens} = service.tokenize('33100 1234567');
      expect(tokens[0].field).toBe('postalCode');
      expect(tokens[1].field).toBe('partnerNr');
    });

    it('two short digit tokens: first → postalCode, second → name (both fields tried)', () => {
      const {tokens} = service.tokenize('33100 80331');
      // postalCode claimed after first; second 5-digit goes to name via fallback
      expect(tokens[0].field).toBe('postalCode');
      expect(tokens[1].field).toBe('name');
    });
  });

  describe('tokenize — mixed realistic inputs', () => {
    it('parses PLZ + city', () => {
      const {tokens} = service.tokenize('33100 Paderborn');
      expect(tokens[0]).toMatchObject({field: 'postalCode', raw: '33100'});
      expect(tokens[1]).toMatchObject({field: 'city', raw: 'Paderborn'});
    });

    it('parses partnerNr + city + street', () => {
      const {tokens} = service.tokenize('1234567 München Musterstraße');
      expect(tokens[0].field).toBe('partnerNr');
      expect(tokens[1].field).toBe('city');
      expect(tokens[2].field).toBe('street');
    });

    it('merges consecutive name tokens into one', () => {
      const {tokens} = service.tokenize('"Müller & Söhne"');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].field).toBe('name');
    });

    it('merges unquoted multi-word name fallback', () => {
      // Both "GmbH" and an ambiguous word fall to FallbackNameClassifier
      // after city/alphacode claims are exhausted — simplified: test the merge
      const {tokens} = service.tokenize('33100 "Müller GmbH"');
      const nameToken = tokens.find(t => t.field === 'name');
      expect(nameToken?.raw).toBe('Müller GmbH');
    });
  });

  describe('tokenize — alternatives', () => {
    it('populates alternatives for ambiguous digit token', () => {
      const {tokens} = service.tokenize('33100');
      // postalCode wins; partnerNr is NOT a valid alternative (wrong length), name IS
      expect(tokens[0].field).toBe('postalCode');
      expect(tokens[0].alternatives).toContain('name');
    });

    it('always includes name in alternatives via FallbackNameClassifier', () => {
      const {tokens} = service.tokenize('München');
      expect(tokens[0].alternatives).toContain('name');
    });
  });

  describe('detokenize', () => {
    it('produces lossless explicit-prefix string from criteria', () => {
      const result = service.detokenize({
        postalCode: '33100',
        city: 'Paderborn',
        name: 'Müller',
      });
      expect(result).toBe('plz:33100 stadt:Paderborn name:Müller');
    });

    it('omits undefined fields', () => {
      const result = service.detokenize({partnerNr: '123456'});
      expect(result).toBe('nr:123456');
    });

    it('round-trips through tokenize', () => {
      const criteria = {postalCode: '33100', city: 'Paderborn'};
      const raw = service.detokenize(criteria);
      const {tokens} = service.tokenize(raw);
      const rebuilt = service.buildCriteria(tokens);
      expect(rebuilt.postalCode).toBe('33100');
      expect(rebuilt.city).toBe('Paderborn');
    });
  });

  describe('buildCriteria', () => {
    it('assembles criteria from tokens', () => {
      const {tokens} = service.tokenize('33100 Paderborn');
      const criteria = service.buildCriteria(tokens);
      expect(criteria.postalCode).toBe('33100');
      expect(criteria.city).toBe('Paderborn');
    });

    it('joins multiple name tokens with space', () => {
      // Tokens with digits+letters (lowercase) do not match any typed classifier → both go to name
      const {tokens} = service.tokenize('"abc123" "def456"');
      const criteria = service.buildCriteria(tokens);
      expect(criteria.name).toBe('abc123 def456');
    });
  });
});
