import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const root = resolve('dist');
async function walk(path) {
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else if (entry.name.endsWith('.html')) result.push(full);
  }
  return result;
}
const pages = await walk(root);
const documents = new Map(await Promise.all(pages.map(async (file) => [file, await readFile(file, 'utf8')])));
const idsFor = (html) => [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
for (const [file, html] of documents) {
  const page = relative(root, file);
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '');
  assert.match(html, /<html lang="sr-Latn"/, page + ': language');
  assert.match(html, /<meta name="description" content="[^"]+"/, page + ': description');
  assert.equal((html.match(/<h1\b/g) || []).length, 1, page + ': exactly one h1');
  const ids = idsFor(markup);
  assert.equal(new Set(ids).size, ids.length, page + ': duplicate IDs');
  assert.ok(!/Lorem ipsum|Većim delom svoga toka|href="https:\/\/wa\.me\/"/.test(html), page + ': placeholder content');
  for (const match of markup.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
    const raw = match[1].replaceAll('&amp;', '&');
    assert.ok(raw, page + ': empty link or asset URL');
    if (/^(?:https?:|mailto:|tel:|data:)/.test(raw)) continue;
    const originPath = '/' + relative(root, file).replaceAll('\\', '/');
    const url = new URL(raw, 'https://local.test' + originPath);
    const path = resolve(root, '.' + decodeURIComponent(url.pathname));
    assert.ok(!relative(root, path).startsWith('..'), page + ': path outside build');
    const candidates = [path, join(path, 'index.html'), path + '.html'];
    let target;
    for (const candidate of candidates) {
      try { if ((await stat(candidate)).isFile()) { target = candidate; break; } } catch {}
    }
    assert.ok(target, page + ': missing target ' + raw);
    if (url.hash && target.endsWith('.html')) {
      const targetHtml = documents.get(target) || await readFile(target, 'utf8');
      assert.ok(idsFor(targetHtml).includes(decodeURIComponent(url.hash.slice(1))), page + ': missing anchor ' + raw);
    }
  }
}
assert.ok(pages.some((file) => file.endsWith('404.html')), 'Missing custom 404');
assert.ok(!existsSync(join(root, 'admin')) && !existsSync(join(root, 'cms')) && !existsSync(join(root, 'studio')), 'CMS must not be shipped with the public website');
console.log('Verified ' + pages.length + ' pages: metadata, headings, local links, anchors and assets.');
