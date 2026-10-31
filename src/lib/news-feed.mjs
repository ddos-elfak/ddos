import { escapeHTML as e } from '@portabletext/to-html';
import { safeLink } from './render-content.mjs';
import { formatDate } from '../utils/calendar.ts';

export function renderNewsCard(item, source) {
  const href = safeLink(item.url, true);
  if (!href) return '';
  const image = safeLink(item.image, true) || (typeof item.image === 'string' && /^\/media\/instagram\/\d+\.(jpg|png|webp)$/.test(item.image) ? item.image : '');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(item.date || '') ? formatDate(item.date) : item.dateLabel || '';
  return `<article class="source-card${image ? ' source-card-image' : ''}"><a href="${e(href)}" target="_blank" rel="noopener noreferrer">${image ? `<img src="${e(image)}" alt="Objava DDOS Instagram naloga" loading="lazy" decoding="async" />` : `<span class="source-badge">${e(source.id === 'elfak' ? 'ELFAK' : source.id === 'sip' ? 'SIP' : 'DDOS')}</span>`}<div class="source-card-copy">${date ? `<span class="source-date">${e(date)}</span>` : ''}<h3>${e(item.title || source.title)}</h3><span class="source-read">${source.id === 'instagram' ? 'Pogledaj na Instagramu' : 'Pročitaj na izvoru'} <span aria-hidden="true">↗</span></span></div></a></article>`;
}
export function latestInstagram(source) {
  return [...(source?.items || [])].filter((item) => item.image && safeLink(item.url, true)).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.publishedAt || '').localeCompare(a.publishedAt || ''))[0];
}
