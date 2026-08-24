export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(req.url);
  // Strip the leading "/api/prove" prefix; whatever remains is the sub-path (e.g. "/check")
  let subPath = url.pathname.replace(/^\/api\/prove/, '');
  if (subPath === '' || subPath === '/') {
    subPath = '/prove'; // base call behavior, matches previous fixed handler
  }

  const upstreamUrl = `https://proof-server.preview.midnight.network${subPath}${url.search}`;

  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer();

  const upstream = await fetch(upstreamUrl, {
    method: req.method,
    headers: { 'Content-Type': req.headers.get('content-type') ?? 'application/octet-stream' },
    body,
  });

  const respBody = await upstream.arrayBuffer();
  return new Response(respBody, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
