import project from '../../sanity-project.json' with { type: 'json' };

export const cmsConfigured = /^[a-z0-9]+$/.test(project.projectId) && /^[a-z0-9_-]+$/.test(project.dataset);
const image = '{"src":asset->url,"width":asset->metadata.dimensions.width,"height":asset->metadata.dimensions.height,alt,caption,crop,hotspot}';
const body = `body[]{..., _type == "image" => ${image}}`;
const projections = {
  news: `_id,"id":slug.current,title,date,summary,"cover":cover${image},${body}`,
  event: `_id,"id":slug.current,title,date,time,location,description,"cover":cover${image},${body}`,
  album: `_id,"id":slug.current,title,date,description,"photos":photos[]${image}`,
  instagramPost: `_id,"id":slug.current,title,date,"publishedAt":_createdAt,permalink,"image":image${image}`,
};
// Samo čitanje, bez tokena. Izmene se rade isključivo kroz zaseban Sanity Studio.
export async function fetchEntries(kind, { offset = 0, limit = 10, from, to, slug } = {}, fetcher = fetch) {
  if (!cmsConfigured) return { items: [], hasMore: false };
  return queryEntries(project, kind, { offset, limit, from, to, slug }, fetcher);
}
export async function queryEntries(config, kind, { offset = 0, limit = 10, from, to, slug } = {}, fetcher = fetch) {
  if (!Object.hasOwn(projections, kind)) throw new Error('Unknown content type');
  const filters = ['_type == $type', '!(_id in path("drafts.**"))'];
  const params = { type: kind, offset, end: offset + limit + 1 };
  if (from && to) { filters.push('date >= $from && date <= $to'); params.from = from; params.to = to; }
  if (slug) { filters.push('slug.current == $slug'); params.slug = slug; }
  const order = kind === 'instagramPost' ? 'date desc, _createdAt desc, _id asc' : 'date desc, _id asc';
  const query = `*[${filters.join(' && ')}] | order(${order})[$offset...$end]{${projections[kind]}}`;
  const url = new URL(`https://${config.projectId}.apicdn.sanity.io/v${config.apiVersion}/data/query/${config.dataset}`);
  url.searchParams.set('query', query);
  url.searchParams.set('perspective', 'published');
  for (const [key, value] of Object.entries(params)) url.searchParams.set('$' + key, JSON.stringify(value));
  const response = await fetcher(url, { signal: AbortSignal.timeout(15000), credentials: 'omit', cache: 'no-store' });
  if (!response.ok) throw new Error('CMS content unavailable');
  const payload = await response.json();
  if (!Array.isArray(payload.result)) throw new Error('Invalid CMS response');
  const items = payload.result.filter((item) => item && typeof item._id === 'string' && !item._id.startsWith('drafts.') && !item._id.startsWith('versions.') && typeof item.title === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && !Number.isNaN(Date.parse(item.date)) && new Date(item.date + 'T12:00:00Z').toISOString().slice(0, 10) === item.date);
  return { items: items.slice(0, limit), hasMore: items.length > limit };
}
