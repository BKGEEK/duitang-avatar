export default async function handler(req, res) {
  const { kw = '', start = '0', limit = '8' } = req.query;

  const upstreamUrl = new URL('https://api.lvxiaodong.com/api/nt');
  upstreamUrl.searchParams.set('kw', kw);
  upstreamUrl.searchParams.set('start', start);
  upstreamUrl.searchParams.set('limit', limit);

  const upstream = await fetch(upstreamUrl.toString(), {
    headers: {
      'accept': 'application/json,text/plain,*/*',
      'accept-language': req.headers['accept-language'] || 'zh-CN,zh;q=0.9',
      'user-agent': req.headers['user-agent'] || 'Mozilla/5.0',
      'referer': 'https://api.lvxiaodong.com/',
      'origin': 'https://api.lvxiaodong.com'
    }
  });

  const bodyText = await upstream.text();

  res.status(upstream.status);
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.send(bodyText);
}
