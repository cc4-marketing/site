// Seed initial entries into KV
// Usage: npx wrangler kv key put --namespace-id=0056bfd0472e481387acaec3f6e8a721 "entries" "$(cat data/entries.json)"

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const entries = readFileSync(join(__dirname, '..', '..', 'changelog-server', 'data', 'entries.json'), 'utf8');

console.log('Seeding entries into KV...');
console.log(`Found ${JSON.parse(entries).length} entries`);

execSync(
  `npx wrangler kv key put --namespace-id=0056bfd0472e481387acaec3f6e8a721 "entries" '${entries.replace(/'/g, "'\\''")}'`,
  { stdio: 'inherit', cwd: join(__dirname, '..') }
);

console.log('Done!');
