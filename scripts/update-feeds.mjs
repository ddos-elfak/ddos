import { readFile, writeFile, mkdir, rename, readdir, unlink } from 'node:fs/promises';
import { sources, fetchSource, fetchInstagram } from './lib/news-sources.mjs';
import { fetchEntries, cmsConfigured } from '../src/lib/cms.mjs';
import { photoUrl } from '../src/lib/render-content.mjs';

const file = new URL('../public/data/external-news.json', import.meta.url);
await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
let previous = { sources: [] };
try { previous = JSON.parse(await readFile(file, 'utf8')); } catch {}
const result = [];
let failures = 0;
for (const source of sources) {
  const old = previous.sources.find((entry) => entry.id === source.id);
  try {
    let items;
    if (source.id !== 'instagram') items = await fetchSource(source);
    else if (process.env.INSTAGRAM_ACCESS_TOKEN) {
      items = await fetchInstagram(process.env.INSTAGRAM_ACCESS_TOKEN, process.env.INSTAGRAM_API_VERSION || 'v25.0');
      // Medijske URL adrese Instagrama ističu; čuvamo javne thumbnails svojih objava.
      for (const item of items) {
        const url = new URL(item.image);
        if (!/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname)) throw new Error('Unsupported Instagram image host');
        const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
        const mime = response.headers.get('content-type')?.split(';')[0];
        const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime];
        if (!response.ok || !ext || Number(response.headers.get('content-length')) > 15_000_000) throw new Error('Instagram image unavailable');
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length > 15_000_000) throw new Error('Instagram image too large');
        const directory = new URL('../public/media/instagram/', import.meta.url);
        await mkdir(directory, { recursive: true });
        await writeFile(new URL(item.id + '.' + ext, directory), bytes);
        item.image = '/media/instagram/' + item.id + '.' + ext;
      }
    } else if (cmsConfigured) {
      const posts = await fetchEntries('instagramPost', { limit: 12 });
      items = posts.items.map((item) => ({ title: item.title, url: item.permalink, date: item.date, publishedAt: item.publishedAt, image: photoUrl(item.image, 1000) })).filter((item) => item.image && /^https:\/\/(www\.)?instagram\.com\/(p|reel)\//.test(item.url || ''));
      if (!items.length && old?.items?.length) { result.push(old); continue; }
    } else { result.push(old || { ...source, items: [] }); continue; }
    result.push({ ...source, checkedAt: new Date().toISOString(), items });
    console.log(source.id + ': ' + items.length + ' objava');
  } catch {
    failures++;
    console.warn(source.id + ': izvor nije dostupan; zadržana je prethodna lista.');
    result.push(old || { ...source, items: [] });
  }
}
const temporary = new URL('external-news.json.tmp', file);
await writeFile(temporary, JSON.stringify({ sources: result }, null, 2) + '\n');
await rename(temporary, file);
// Ovaj direktorijum je samo generisani cache, a ne arhiva originalnih fotografija.
const imageDirectory = new URL('../public/media/instagram/', import.meta.url);
const usedImages = new Set(result.flatMap((source) => source.items || []).map((item) => item.image));
try {
  for (const entry of await readdir(imageDirectory, { withFileTypes: true })) {
    if (entry.isFile() && /^\d+\.(jpg|png|webp)$/.test(entry.name) && !usedImages.has('/media/instagram/' + entry.name)) await unlink(new URL(entry.name, imageDirectory));
  }
} catch (error) { if (error.code !== 'ENOENT') throw error; }
if (failures === sources.length) process.exitCode = 1;
