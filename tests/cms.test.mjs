import test from 'node:test';
import assert from 'node:assert/strict';
import { queryEntries } from '../src/lib/cms.mjs';
import { renderBody, renderEntry, safeLink, photoUrl } from '../src/lib/render-content.mjs';

const config = { projectId: 'testproject', dataset: 'production', apiVersion: '2026-03-01' };
const span = (text, marks = []) => ({ _type: 'span', _key: 'span', text, marks });
const block = (text, overrides = {}) => ({ _type: 'block', _key: 'block', style: 'normal', markDefs: [], children: [span(text)], ...overrides });
const entry = { _id: 'one', id: 'game-day-2026', title: 'Game Day 2026', date: '2026-11-15', description: 'Druženje studenata' };
const photo = (index) => ({ src: '/photos/' + index + '.webp', alt: 'Fotografija ' + index, caption: 'Potpis ' + index, width: 1600, height: 1067 });

test('CMS requests are read-only, published-only and parameterized', async () => {
  let observed;
  const fetcher = async (url, options) => { observed = { url, options }; return { ok: true, json: async () => ({ result: [entry] }) }; };
  const result = await queryEntries(config, 'event', { from: '2099-01-01', to: '2099-01-31', slug: '"malicious query', offset: 20, limit: 10 }, fetcher);
  assert.equal(result.items.length, 1);
  assert.equal(observed.url.searchParams.get('perspective'), 'published');
  assert.match(observed.url.searchParams.get('query'), /drafts\.\*\*/);
  assert.ok(!observed.url.searchParams.get('query').includes('malicious'));
  assert.equal(JSON.parse(observed.url.searchParams.get('$slug')), '"malicious query');
  assert.equal(observed.url.searchParams.get('$from'), '"2099-01-01"');
  assert.equal(observed.options.credentials, 'omit');
  assert.equal(observed.options.headers, undefined);
});
test('drafts, versions and invalid dates are excluded even in an unexpected API response', async () => {
  const items = [entry, { ...entry, _id: 'drafts.secret' }, { ...entry, _id: 'versions.release.secret' }, { ...entry, _id: 'bad', date: '2026-02-31' }];
  const result = await queryEntries(config, 'news', {}, async () => ({ ok: true, json: async () => ({ result: items }) }));
  assert.deepEqual(result.items, [entry]);
});
test('pagination, API failures and unsupported collections', async () => {
  const result = await queryEntries(config, 'news', { limit: 1 }, async () => ({ ok: true, json: async () => ({ result: [entry, { ...entry, _id: 'two' }] }) }));
  assert.equal(result.hasMore, true); assert.equal(result.items.length, 1);
  await assert.rejects(queryEntries(config, 'news', {}, async () => ({ ok: false })), /unavailable/);
  await assert.rejects(queryEntries(config, 'admin'), /Unknown/);
});
test('rich text preserves formatting and escapes titles, body and unsafe links', () => {
  const html = renderBody([block('<script>alert(1)</script>', { children: [span('<script>alert(1)</script>', ['strong', 'evil'])], markDefs: [{ _key: 'evil', _type: 'link', href: 'javascript:alert(1)' }] }), block('Podnaslov', { style: 'h2' })]);
  assert.ok(html.includes('&lt;script&gt;')); assert.ok(html.includes('<strong>'));
  assert.ok(html.includes('<h2>Podnaslov</h2>')); assert.ok(!html.includes('javascript:'));
  assert.ok(!renderEntry({ ...entry, title: '<img src=x onerror=alert(1)>' }, 'news').includes('<img src=x'));
  for (const url of ['javascript:alert(1)', '//evil.test', '/\\evil.test', 'data:text/html,evil', ' https://evil.test']) assert.equal(safeLink(url), '');
  assert.equal(safeLink('https://ddos.rs/'), 'https://ddos.rs/');
  assert.equal(photoUrl({ src: 'https://evil.test/image.png' }), '');
});
test('news supports paragraph, image, link and external poll blocks', () => {
  const body = [block('Prvi pasus'), { _type: 'image', ...photo(1) }, block('Link', { children: [span('Link', ['link'])], markDefs: [{ _key: 'link', _type: 'link', href: 'https://ddos.rs/' }] }), { _type: 'pollLink', title: 'Koju igru?', url: 'https://forms.google.com/example', buttonLabel: 'Glasaj' }];
  const html = renderEntry({ ...entry, summary: 'Uvod', body }, 'news');
  assert.match(html, /Prvi pasus/); assert.match(html, /<figure>/); assert.match(html, /noopener noreferrer/); assert.match(html, /Koju igru\?/); assert.match(html, />Glasaj<\/a>/);
});
test('a 15-image album stays grouped, ordered and includes a caption for each photo', () => {
  const html = renderEntry({ ...entry, photos: Array.from({ length: 15 }, (_, index) => photo(index + 1)) }, 'album');
  assert.equal((html.match(/data-gallery-image/g) || []).length, 15);
  assert.equal((html.match(/data-album="album-game-day-2026"/g) || []).length, 15);
  assert.match(html, /Otvori album \(15 fotografija\)/);
  assert.ok(html.indexOf('Potpis 1') < html.indexOf('Potpis 15'));
  assert.match(html, /<h2>Game Day 2026<\/h2>/);
});
test('image URLs apply the crop selected in Studio and optimize delivery', () => {
  const url = new URL(photoUrl({ src: 'https://cdn.sanity.io/images/testproject/production/hash-1000x800.jpg', width: 1000, height: 800, crop: { left: 0.1, right: 0.1, top: 0.1, bottom: 0.1 } }, 800));
  assert.equal(url.searchParams.get('rect'), '100,80,800,640');
  assert.equal(url.searchParams.get('w'), '800');
  assert.equal(url.searchParams.get('auto'), 'format');
  assert.equal(url.searchParams.get('fit'), 'max');
});
