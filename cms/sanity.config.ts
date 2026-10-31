import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import project from '../sanity-project.json';
import { schemaTypes } from './schemaTypes';

// Jedini placeholder služi za lokalnu proveru builda; povezivanje se radi kroz cms:setup.
export default defineConfig({
  name: 'ddos',
  title: 'DDOS — uređivanje sajta',
  projectId: project.projectId || 'unlinked',
  dataset: project.dataset,
  plugins: [structureTool({
    structure: (S) => S.list().title('Sadržaj sajta').items([
      S.documentTypeListItem('news').title('Novosti'),
      S.documentTypeListItem('event').title('Događaji i aktivnosti'),
      S.documentTypeListItem('album').title('Albumi u galeriji'),
      S.documentTypeListItem('instagramPost').title('Instagram — odabrane objave'),
    ]),
  })],
  schema: { types: schemaTypes },
});
