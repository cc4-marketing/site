import { describe, expect, it } from 'vitest';
import { injectPngText } from '../png-metadata';

// Minimal valid PNG: 8-byte signature + IHDR (1x1, 8-bit grayscale) + IEND.
function minimalPng(): Uint8Array {
  return new Uint8Array([
    // signature
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    // IHDR: length=13
    0x00, 0x00, 0x00, 0x0d,
    // type: IHDR
    0x49, 0x48, 0x44, 0x52,
    // width=1, height=1, bit-depth=8, color-type=0, compression=0, filter=0, interlace=0
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x00, 0x00, 0x00, 0x00,
    // crc (not verified by injector)
    0x37, 0x6e, 0xf9, 0x24,
    // IEND: length=0
    0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4e, 0x44,
    // crc
    0xae, 0x42, 0x60, 0x82,
  ]);
}

describe('injectPngText', () => {
  it('preserves the 8-byte PNG signature', () => {
    const out = injectPngText(minimalPng(), { a: 'b' });
    expect([...out.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });

  it('inserts a tEXt chunk after IHDR', () => {
    const out = injectPngText(minimalPng(), { hello: 'world' });
    // tEXt signature "tEXt" should appear after the IHDR block (offset 33)
    const tEXt = [0x74, 0x45, 0x58, 0x74];
    const idx = findSubsequence(out, tEXt);
    expect(idx).toBeGreaterThan(30);
    expect(idx).toBeLessThan(50);
  });

  it('preserves the original IEND chunk at the end', () => {
    const out = injectPngText(minimalPng(), { k: 'v' });
    const tail = out.slice(-8);
    expect([...tail]).toEqual([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  });

  it('grows the PNG by the expected chunk overhead', () => {
    const input = minimalPng();
    const keyword = 'engine-version';
    const value = '1';
    const out = injectPngText(input, { [keyword]: value });
    // 4 length + 4 type + keyword + NUL + value + 4 crc
    const expectedGrowth = 4 + 4 + keyword.length + 1 + value.length + 4;
    expect(out.byteLength - input.byteLength).toBe(expectedGrowth);
  });

  it('embeds the keyword and value as UTF-8 bytes with a NUL separator', () => {
    const out = injectPngText(minimalPng(), { engine: 'v1' });
    const encoder = new TextEncoder();
    const needle = new Uint8Array([...encoder.encode('engine'), 0x00, ...encoder.encode('v1')]);
    expect(findSubsequence(out, [...needle])).toBeGreaterThan(0);
  });
});

function findSubsequence(bytes: Uint8Array, needle: number[]): number {
  outer: for (let i = 0; i <= bytes.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (bytes[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}
