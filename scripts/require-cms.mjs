import project from '../sanity-project.json' with { type: 'json' };
if (!project.projectId) {
  console.error('Sanity projekat još nije povezan. Prvo pokreni npm run cms:setup.');
  process.exitCode = 1;
}
