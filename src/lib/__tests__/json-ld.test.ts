import { describe, it, expect } from 'vitest';
import { jsonLd } from '../json-ld';

describe('jsonLd', () => {
  it('cannot close the surrounding <script> tag', () => {
    const out = jsonLd({ headline: 'x</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(out).not.toContain('<');
  });

  it('stays valid JSON that round-trips to the original data', () => {
    const data = { name: 'a < b', line: `p${String.fromCharCode(0x2028)}q` };
    expect(JSON.parse(jsonLd(data))).toEqual(data);
  });
});
