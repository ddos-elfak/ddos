import { defineCliConfig } from 'sanity/cli';
import project from '../sanity-project.json';
export default defineCliConfig({
  api: { projectId: project.projectId || 'unlinked', dataset: project.dataset },
  deployment: { appId: 'ctju16mso8dpy0xva2s95gll' },
});
