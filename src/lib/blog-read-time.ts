// Reading-time estimate for the post masthead chip (plan U3).
// Walks PortableText blocks at render time (posts are D1 rows; no stored
// word-count field exists). 200 wpm, rounded up, floor of 1 minute.
const WORDS_PER_MINUTE = 200;

export function readTimeMinutes(blocks: any[] | undefined): number {
  if (!blocks?.length) return 1;
  let words = 0;
  for (const block of blocks) {
    if (block._type === 'block' && Array.isArray(block.children)) {
      for (const child of block.children) {
        if (typeof child.text === 'string') {
          words += child.text.split(/\s+/).filter(Boolean).length;
        }
      }
    } else if (block._type === 'code' && typeof block.code === 'string') {
      // Code reads slower than prose; count lines as ~4 words each
      words += block.code.split('\n').length * 4;
    }
  }
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
