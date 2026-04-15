/**
 * Minimal PNG tEXt chunk injector. Lets us stamp build metadata
 * (engine-version, generated-at, commit) into the raw PNG bytes, so when a
 * crawler reports a stale image weeks later we can run `exiftool` or
 * `pngcheck -t` and know exactly which deploy produced it.
 *
 * PNG spec §11.3.4: a tEXt chunk is keyword + NUL + value, wrapped in
 * [length][type][data][crc32]. We insert it right after IHDR.
 */

const CRC_TABLE: number[] = (() => {
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function uint32BE(value: number): Uint8Array {
  return new Uint8Array([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);
}

function textChunk(keyword: string, value: string): Uint8Array {
  const data = new TextEncoder().encode(`${keyword}\0${value}`);
  const type = new TextEncoder().encode('tEXt');
  const crcInput = new Uint8Array(type.byteLength + data.byteLength);
  crcInput.set(type, 0);
  crcInput.set(data, type.byteLength);
  const crc = crc32(crcInput);

  const out = new Uint8Array(4 + 4 + data.byteLength + 4);
  out.set(uint32BE(data.byteLength), 0);
  out.set(type, 4);
  out.set(data, 8);
  out.set(uint32BE(crc), 8 + data.byteLength);
  return out;
}

/**
 * Returns a new PNG byte array with one or more tEXt chunks inserted after
 * IHDR. Input must be a valid PNG (we don't re-validate beyond the 8-byte
 * signature + IHDR length prefix).
 */
export function injectPngText(png: Uint8Array, entries: Record<string, string>): Uint8Array {
  // 8-byte PNG signature + IHDR = 8 + 4 length + 4 type + 13 data + 4 crc = 33 bytes
  const IHDR_END = 8 + 4 + 4 + 13 + 4;
  const chunks: Uint8Array[] = [];
  for (const [keyword, value] of Object.entries(entries)) {
    chunks.push(textChunk(keyword, value));
  }
  const insert = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
  let o = 0;
  for (const c of chunks) {
    insert.set(c, o);
    o += c.byteLength;
  }
  const out = new Uint8Array(png.byteLength + insert.byteLength);
  out.set(png.subarray(0, IHDR_END), 0);
  out.set(insert, IHDR_END);
  out.set(png.subarray(IHDR_END), IHDR_END + insert.byteLength);
  return out;
}
