import { load } from 'cheerio';
import { belgradeToday } from '../../src/utils/calendar.ts';

export const sources = [
  { id: 'elfak', title: 'Elektronski fakultet', url: 'https://www.elfak.ni.ac.rs/informacije/novosti-i-obavestenja', feedUrl: 'https://www.elfak.ni.ac.rs/informacije/novosti-i-obavestenja?format=feed&type=rss' },
  { id: 'sip', title: 'SIP: studentska obaveštenja', url: 'https://sip.elfak.ni.ac.rs/' },
  { id: 'instagram', title: 'DDOS na Instagramu', url: 'https://www.instagram.com/ddos_elfak/' },
];
const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();
function link(value, base) {
  try { const url = new URL(value, base); return url.protocol === 'https:' && url.hostname === new URL(base).hostname ? url.href : ''; } catch { return ''; }
}
export function parseSource(html, source) {
  if (/<rss[\s>]/i.test(html)) {
    const $ = load(html, { xmlMode: true });
    const seen = new Set();
    const items = $('channel > item').toArray().map((element) => {
      const item = $(element); const published = new Date(item.find('pubDate').text());
      return { title: clean(item.find('title').text()), url: link(item.find('link').text(), source.url), date: Number.isNaN(published.getTime()) ? '' : belgradeToday(published) };
    }).filter((item) => item.title && item.url && !seen.has(item.url) && seen.add(item.url)).slice(0, 15);
    if (!items.length) throw new Error('No articles found for ' + source.id);
    return items;
  }
  const $ = load(html);
  const entries = [];
  if (source.id === 'elfak') {
    $('article.item').each((_, element) => {
      const article = $(element); const anchor = article.find('h2 a').first();
      entries.push({ title: clean(anchor.text()), url: link(anchor.attr('href'), source.url), date: article.find('time[datetime]').attr('datetime')?.slice(0, 10) || '' });
    });
  } else if (source.id === 'sip') {
    $('#novosti .news-box').first().find('li').each((_, element) => {
      const article = $(element);
      entries.push({ title: clean(article.find('h4').text()), url: link(article.find('a[href*="/article/"]').attr('href'), source.url), dateLabel: clean(article.find('.date').text()) });
    });
  }
  const seen = new Set();
  const result = entries.filter((item) => item.title && item.url && !seen.has(item.url) && seen.add(item.url)).slice(0, 15);
  // Promenjen HTML ili blokada izvora ne sme da obriše poslednju uspešnu listu.
  if (!result.length) throw new Error('No articles found for ' + source.id);
  return result;
}
export async function fetchSource(source, fetcher = fetch) {
  if (source.feedUrl) {
    try {
      const response = await fetcher(source.feedUrl, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/rss+xml, application/xml' } });
      if (response.ok) return parseSource(await response.text(), source);
    } catch { /* HTML lista je rezerva ako RSS izvor nije dostupan. */ }
  }
  const response = await fetcher(source.url, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'DDOS student news reader (+https://ddos.rs)', Accept: 'text/html' } });
  if (!response.ok) throw new Error('Source unavailable');
  return parseSource(await response.text(), source);
}
export function instagramItems(media) {
  return (media || []).filter((item) => /^\d+$/.test(item.id) && /^https:\/\/(www\.)?instagram\.com\/(p|reel)\//.test(item.permalink || '')).map((item) => ({
    id: item.id, title: 'DDOS na Instagramu', url: item.permalink, date: item.timestamp?.slice(0, 10) || '', publishedAt: item.timestamp || '',
    image: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
  })).filter((item) => item.image && /^https:\/\//.test(item.image)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 12);
}
export async function fetchInstagram(token, version = 'v25.0', fetcher = fetch) {
  if (!/^v\d+\.\d+$/.test(version)) throw new Error('Invalid Instagram API version');
  const url = new URL('https://graph.instagram.com/' + version + '/me/media');
  url.searchParams.set('fields', 'id,media_type,media_url,thumbnail_url,permalink,timestamp');
  url.searchParams.set('limit', '12');
  const response = await fetcher(url, { signal: AbortSignal.timeout(20000), headers: { Authorization: 'Bearer ' + token } });
  if (!response.ok) throw new Error('Instagram connection needs attention');
  const payload = await response.json();
  if (!Array.isArray(payload.data)) throw new Error('Invalid Instagram response');
  return instagramItems(payload.data);
}
