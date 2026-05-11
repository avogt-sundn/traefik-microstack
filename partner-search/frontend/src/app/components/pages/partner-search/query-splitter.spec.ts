import {describe, expect, it} from 'vitest';
import {splitQuery} from './query-splitter';

describe('splitQuery', () => {
  it('splits on whitespace', () => {
    const result = splitQuery('33100 München');
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe('33100');
    expect(result[1].value).toBe('München');
  });

  it('handles multiple spaces between tokens', () => {
    const result = splitQuery('33100   München');
    expect(result).toHaveLength(2);
  });

  it('strips double quotes and treats content as one token', () => {
    const result = splitQuery('"Müller & Söhne"');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('Müller & Söhne');
  });

  it('keeps hyphens inside a token', () => {
    const result = splitQuery('Müller-Bauer');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('Müller-Bauer');
  });

  it('keeps trailing dot inside a token', () => {
    const result = splitQuery('Musterstr.');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('Musterstr.');
  });

  it('keeps colon inside a token (explicit prefix syntax)', () => {
    const result = splitQuery('plz:33100');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('plz:33100');
  });

  it('splits explicit prefix token from adjacent token', () => {
    const result = splitQuery('plz:331 München');
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe('plz:331');
    expect(result[1].value).toBe('München');
  });

  it('tracks correct startIndex and endIndex', () => {
    const result = splitQuery('abc def');
    expect(result[0].startIndex).toBe(0);
    expect(result[0].endIndex).toBe(3);
    expect(result[1].startIndex).toBe(4);
    expect(result[1].endIndex).toBe(7);
  });

  it('quoted token startIndex includes the opening quote', () => {
    const result = splitQuery('"hello world"');
    expect(result[0].startIndex).toBe(0);
    expect(result[0].endIndex).toBe(13);
    expect(result[0].value).toBe('hello world');
  });

  it('returns empty array for blank input', () => {
    expect(splitQuery('')).toHaveLength(0);
    expect(splitQuery('   ')).toHaveLength(0);
  });

  it('handles mixed quoted and unquoted tokens', () => {
    const result = splitQuery('33100 "Müller & Söhne" München');
    expect(result).toHaveLength(3);
    expect(result[1].value).toBe('Müller & Söhne');
  });

  it('discards empty quoted strings', () => {
    const result = splitQuery('""  abc');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('abc');
  });
});
