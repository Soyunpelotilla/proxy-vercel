export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }

  const url = new URL(req.url);
  let cleanPath = url.pathname.replace(/^\//, '') + url.search;

  if (!cleanPath || cleanPath === '') {
    return new Response('🚀 ¡Proxy Edge Activo en Vercel!', { status: 200 });
  }

  let targetUrl = '';
  if (cleanPath.startsWith('ipfs/') || cleanPath.startsWith('ipns/')) {
    targetUrl = `https://ipfs.io/${cleanPath}`;
  } else if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    targetUrl = cleanPath;
  } else if (/^https?:\/([^/])/.test(cleanPath)) {
    targetUrl = cleanPath.replace(/^https?:\//, m => m + '/');
  } else {
    targetUrl = `https://${cleanPath}`;
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers.get('user-agent') || 'Mozilla/5.0',
        'Accept': req.headers.get('accept') || '*/*',
        'Accept-Encoding': 'identity',
      },
      redirect: 'follow',
    });

    const headers = new Headers();
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'content-security-policy'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (e) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
}

export const config = {
  runtime: 'edge',
};
