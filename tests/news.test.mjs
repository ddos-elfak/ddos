import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSource, sources, fetchInstagram } from '../scripts/lib/news-sources.mjs';
import { renderNewsCard, latestInstagram } from '../src/lib/news-feed.mjs';
import { loadNewsSnapshot } from '../src/lib/news-snapshot.mjs';
import { calendarEvents } from '../src/utils/events.mjs';

test('ELFAK news parser extracts headline, canonical link and date without copying full articles', () => {
  const html = '<article class="item"><time datetime="2026-10-31T10:00:00+01:00"></time><h2><a href="/informacije/novosti-i-obavestenja/test"> Važno &amp; novo </a></h2><p>Puna vest se ne prenosi</p></article>';
  const [item] = parseSource(html, sources[0]);
  assert.equal(item.title, 'Važno & novo'); assert.equal(item.date, '2026-10-31');
  assert.equal(item.url, 'https://www.elfak.ni.ac.rs/informacije/novosti-i-obavestenja/test');
  assert.equal(item.description, undefined);
  assert.throws(() => parseSource('<html>Privremeno nedostupno</html>', sources[0]), /No articles/);
});
test('SIP parser reads latest news, ignores other lists and removes duplicates', () => {
  const item = '<li><p class="date">31. Окт. 2026.</p><h4>Upis</h4><a href="/article/upis/test">Opširnije</a></li>';
  const html = '<section id="novosti"><div class="news-box"><ul>' + item + item + '</ul></div><div class="news-box"><li><h4>Duplikat u drugoj koloni</h4></li></div></section>';
  const result = parseSource(html, sources[1]);
  assert.equal(result.length, 1); assert.equal(result[0].title, 'Upis');
  assert.equal(result[0].url, 'https://sip.elfak.ni.ac.rs/article/upis/test');
});
test('official RSS is supported and dates use Serbian time', () => {
  const xml = '<rss><channel><item><title>Nova vest</title><link>https://www.elfak.ni.ac.rs/vest</link><pubDate>Sun, 01 Nov 2026 00:30:00 +0100</pubDate></item></channel></rss>';
  const [item] = parseSource(xml, sources[0]); assert.equal(item.date, '2026-11-01'); assert.equal(item.title, 'Nova vest');
});
test('only unexpired activity dates appear in calendar; removing an activity removes its marker input', () => {
  const items = [{ _type: 'event', date: '2026-11-05' }, { _type: 'event', date: '2026-10-30' }, { _type: 'news', date: '2026-11-05' }, { _type: 'album', date: '2026-11-05' }];
  assert.deepEqual(calendarEvents(items, '2026-10-31'), [items[0]]);
  assert.deepEqual(calendarEvents(items, '2026-11-05'), [items[0]]);
  assert.deepEqual(calendarEvents(items, '2026-11-06'), []);
  assert.deepEqual(calendarEvents([], '2026-10-31'), []);
});
test('Instagram requests only display media; captions and tokens never enter public snapshot items', async () => {
  let request;
  const items = await fetchInstagram('private-token', 'v25.0', async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ data: [{ id: '123', media_type: 'IMAGE', media_url: 'https://cdn.example/image.jpg', permalink: 'https://www.instagram.com/p/abc/', timestamp: '2026-10-31T12:00:00Z', caption: 'Opis se ne prikazuje' }] }) };
  });
  assert.equal(request.url.hostname, 'graph.instagram.com');
  assert.ok(!request.url.searchParams.get('fields').includes('caption'));
  assert.equal(request.options.headers.Authorization, 'Bearer private-token');
  assert.ok(!JSON.stringify(items).includes('private-token'));
  assert.ok(!JSON.stringify(items).includes('Opis se ne prikazuje'));
  assert.equal(latestInstagram({ items }).url, 'https://www.instagram.com/p/abc/');
});
test('news cards escape titles and reject unsafe destinations', () => {
  assert.equal(renderNewsCard({ url: 'javascript:alert(1)' }, sources[0]), '');
  const html = renderNewsCard({ url: 'https://sip.elfak.ni.ac.rs/article/a', title: '<script>alert(1)</script>' }, sources[1]);
  assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('noopener noreferrer'));
});
test('unavailable remote news uses the local saved list', async () => {
  const calls = [];
  const data = await loadNewsSnapshot(async (url) => { calls.push(url); return url.startsWith('https:') ? { ok: false } : { ok: true, json: async () => ({ sources: [{ id: 'elfak', items: [] }] }) }; });
  assert.equal(calls.length, 2); assert.equal(data.sources[0].id, 'elfak');
});
