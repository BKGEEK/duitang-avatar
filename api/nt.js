export default async function handler(req, res) {
  const { kw = '', start = '0', limit = '8' } = req.query;

  const url = new URL('https://api.lvxiaodong.com/api/nt');
  url.searchParams.set('kw', kw);
  url.searchParams.set('start', start);
  url.searchParams.set('limit', limit);

  const upstream = await fetch(url.toString(), {
    headers: {
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
      'Referer': req.headers.referer || 'https://duitang-avatar.888422.xyz/',
      'Origin': req.headers.origin || 'https://duitang-avatar.888422.xyz/'
    }
  });

  const bodyText = await upstream.text();
  res.status(upstream.status);
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.send(bodyText);
}
