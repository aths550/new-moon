export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const body = await req.arrayBuffer();
  const upstream = await fetch('https://proof-server.preview.midnight.network/prove', {
    method: 'POST',
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
