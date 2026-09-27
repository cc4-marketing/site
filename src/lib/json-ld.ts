/**
 * Serialize an object for a <script type="application/ld+json"> block.
 * JSON.stringify alone leaves "<" intact, so a CMS title containing
 * "</script>" would close the tag and let the rest run as HTML/script.
 * Escaping "<" (plus the two JS line terminators U+2028/U+2029) keeps the JSON valid.
 */
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .split(LS).join('\\u2028')
    .split(PS).join('\\u2029');
}
