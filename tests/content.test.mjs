import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { news, events, gallery } from '../src/data/content.ts';
import { site } from '../src/config/site.ts';

const validDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date + 'T12:00:00Z').toISOString().slice(0, 10) === date;
test('published content has valid dates, unique safe IDs and required text', () => {
  for (const collection of [news, events]) {
    assert.equal(new Set(collection.map((item) => item.id)).size, collection.length);
    for (const item of collection) {
      assert.match(item.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.ok(item.title.trim());
      assert.ok(validDate(item.date), 'Invalid date: ' + item.date);
    }
  }
  for (const post of news) {
    assert.ok(post.summary.trim());
    assert.ok(Array.isArray(post.paragraphs));
    post.paragraphs.forEach((paragraph) => assert.ok(paragraph.trim()));
  }
  for (const event of events) {
    assert.ok(event.location.trim());
    assert.ok(event.description.trim());
    if (event.time) assert.match(event.time, /^(?:[01]\d|2[0-3]):[0-5]\d$/);
  }
});
test('gallery images exist locally and include accessible descriptions and dimensions', () => {
  for (const photo of gallery.flatMap((album) => album.photos)) {
    assert.ok(photo.src.startsWith('/') && !photo.src.startsWith('//') && !photo.src.includes('..'));
    assert.ok(existsSync(new URL('../public' + photo.src, import.meta.url)), 'Missing photo: ' + photo.src);
    assert.ok(photo.alt.trim());
    assert.ok(photo.caption.trim());
    assert.ok(Number.isInteger(photo.width) && photo.width > 0);
    assert.ok(Number.isInteger(photo.height) && photo.height > 0);
  }
});
test('configured external destinations use HTTPS; WhatsApp may be omitted', () => {
  for (const href of [site.joinUrl, site.instagramUrl, site.discordUrl, site.whatsappUrl].filter(Boolean)) {
    assert.equal(new URL(href).protocol, 'https:');
  }
});
