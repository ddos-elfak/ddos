import { toHTML, escapeHTML as e } from '@portabletext/to-html';
import { formatDate } from '../utils/calendar.ts';

export function safeLink(value, httpsOnly = false) {
  if (typeof value !== 'string' || /[\u0000-\u0020\\]/.test(value)) return '';
  if (!httpsOnly && /^\/(?!\/)/.test(value)) return value;
  try { const url = new URL(value); return (httpsOnly ? ['https:'] : ['https:', 'http:', 'mailto:', 'tel:']).includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
export function photoUrl(photo, width = 1200) {
  const src = photo?.src;
  if (typeof src !== 'string') return '';
  if (/^\/(?!\/)/.test(src) && !/[\\\u0000-\u0020]/.test(src)) return src;
  try {
    const url = new URL(src);
    if (url.protocol !== 'https:' || url.hostname !== 'cdn.sanity.io' || !url.pathname.startsWith('/images/')) return '';
    const geometry = photoGeometry(photo);
    if (geometry && photo.crop) url.searchParams.set('rect', [geometry.left, geometry.top, geometry.width, geometry.height].join(','));
    url.searchParams.set('w', String(width)); url.searchParams.set('fit', 'max'); url.searchParams.set('auto', 'format');
    return url.href;
  } catch { return ''; }
}
function photoGeometry(photo) {
  if (!Number.isFinite(photo?.width) || !Number.isFinite(photo?.height) || photo.width <= 0 || photo.height <= 0) return null;
  const crop = photo.crop || {};
  const fraction = (value) => Number.isFinite(value) && value >= 0 && value < 1 ? value : 0;
  const left = Math.round(fraction(crop.left) * photo.width); const top = Math.round(fraction(crop.top) * photo.height);
  return { left, top, width: Math.max(1, Math.round(photo.width - left - fraction(crop.right) * photo.width)), height: Math.max(1, Math.round(photo.height - top - fraction(crop.bottom) * photo.height)) };
}
function imageHTML(photo, fallback, width = 1200) {
  const src = photoUrl(photo, width);
  if (!src) return '';
  const geometry = photoGeometry(photo);
  const dimensions = geometry ? ` width="${geometry.width}" height="${geometry.height}"` : '';
  const focal = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0.5)) * 100;
  const position = photo.hotspot ? ` style="object-position:${focal(photo.hotspot.x)}% ${focal(photo.hotspot.y)}%"` : '';
  return `<img src="${e(src)}" alt="${e(photo.alt || fallback)}"${dimensions}${position} loading="lazy" decoding="async" />`;
}
export function renderBody(blocks, fallback = '') {
  if (!Array.isArray(blocks) || !blocks.length) return '';
  return toHTML(blocks, { components: {
    marks: {
      link: ({ children, value }) => { const url = safeLink(value?.href); return url ? `<a href="${e(url)}"${url.startsWith('/') ? '' : ' target="_blank" rel="noopener noreferrer"'}>${children}</a>` : children; },
      underline: ({ children }) => `<u>${children}</u>`,
    },
    types: {
      image: ({ value }) => `<figure>${imageHTML(value, fallback)}${value.caption ? `<figcaption>${e(value.caption)}</figcaption>` : ''}</figure>`,
      pollLink: ({ value }) => { const url = safeLink(value.url, true); return url ? `<aside class="poll-link"><h3>${e(value.title || 'Anketa')}</h3>${value.description ? `<p>${e(value.description)}</p>` : ''}<a class="cta-button" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(value.buttonLabel || 'Glasaj u anketi')}</a><p class="content-note">Anketa se otvara u novoj kartici.</p></aside>` : ''; },
      divider: () => '<hr />',
    },
    unknownType: () => '',
    unknownBlockStyle: ({ children }) => `<p>${children}</p>`,
  }, onMissingComponent: false });
}
export function entryId(entry, prefix = 'post') {
  return prefix + '-' + String(entry.id || entry._id || 'objava').replace(/[^\p{L}\p{N}_-]/gu, '-');
}
export function renderEntry(entry, kind) {
  const id = entryId(entry, kind === 'album' ? 'album' : kind === 'event' ? 'event' : 'post');
  const title = e(entry.title);
  const date = `<time datetime="${e(entry.date)}">${e(formatDate(entry.date))}${kind === 'event' && entry.time ? ' u ' + e(entry.time) : ''}</time>`;
  const link = `<a class="permalink" href="#${e(encodeURIComponent(id))}" aria-label="Link do objave: ${title}">Link do objave</a>`;
  if (kind === 'album') {
    const photos = (entry.photos || []).filter((photo) => photoUrl(photo));
    const cover = photos[0] ? `<a href="#${e(id)}" data-open-album>${imageHTML(photos[0], entry.title, 800)}</a>` : '';
    return `<article id="${e(id)}" class="album-post">${date}<h2>${title}</h2>${entry.description ? `<p>${e(entry.description)}</p>` : ''}${cover}<details class="album-details"><summary>Otvori album (${photos.length} fotografija)</summary><div class="gallery-grid">${photos.map((photo, index) => `<figure><a href="${e(photoUrl(photo, 2000))}" data-gallery-image data-album="${e(id)}" data-caption="${e(photo.caption || entry.title + ' — ' + (index + 1))}" aria-label="Uvećaj: ${e(photo.alt || entry.title + ' — fotografija ' + (index + 1))}">${imageHTML(photo, entry.title + ' — fotografija ' + (index + 1), 800)}</a>${photo.caption ? `<figcaption>${e(photo.caption)}</figcaption>` : ''}</figure>`).join('')}</div></details>${link}</article>`;
  }
  const body = renderBody(entry.body, entry.title) || (entry.paragraphs || []).map((paragraph) => `<p>${e(paragraph)}</p>`).join('');
  return `<article id="${e(id)}" class="content-post">${date}<h2>${title}</h2>${entry.cover ? `<figure class="post-cover">${imageHTML(entry.cover, entry.title)}${entry.cover.caption ? `<figcaption>${e(entry.cover.caption)}</figcaption>` : ''}</figure>` : ''}${kind === 'event' && entry.location ? `<p><strong>Lokacija:</strong> ${e(entry.location)}</p>` : ''}<p>${e(entry.summary || entry.description || '')}</p>${body ? `<details><summary>Pročitaj više <span class="sr-only">— ${title}</span></summary><div class="rich-content">${body}</div></details>` : ''}${link}</article>`;
}
