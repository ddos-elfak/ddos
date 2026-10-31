import { createInterface } from 'node:readline/promises';
import { readFile, writeFile } from 'node:fs/promises';
const file = new URL('../sanity-project.json', import.meta.url);
const project = JSON.parse(await readFile(file, 'utf8'));
const rl = createInterface({ input: process.stdin, output: process.stdout });
try {
  const projectId = (process.argv[2] || await rl.question('Sanity project ID (iz sanity.io/manage): ')).trim();
  const dataset = (process.argv[3] || await rl.question('Dataset [production]: ') || 'production').trim();
  if (!/^[a-z0-9]+$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset)) throw new Error('Neispravan project ID ili dataset.');
  await writeFile(file, JSON.stringify({ ...project, projectId, dataset }, null, 2) + '\n');
  console.log('Povezivanje je podešeno. Pokreni npm run check, objavi sajt i pokreni npm run cms:deploy.');
} finally { rl.close(); }
