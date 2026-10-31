import config from '../../news-config.json' with { type: 'json' };

export async function loadNewsSnapshot(fetcher = fetch, remote = true) {
  const urls = remote ? [config.snapshotUrl, '/data/external-news.json'] : ['/data/external-news.json'];
  for (const url of urls.filter(Boolean)) {
    try {
      const response = await fetcher(url, { cache: 'no-cache', credentials: 'omit', signal: AbortSignal.timeout(8000) });
      if (!response.ok) continue;
      const data = await response.json();
      if (!Array.isArray(data.sources) || !data.sources.every((source) => Array.isArray(source.items))) continue;
      return data;
    } catch { /* Sledeća adresa je lokalna sačuvana lista. */ }
  }
  throw new Error('News snapshot unavailable');
}
