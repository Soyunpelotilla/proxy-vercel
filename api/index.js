const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') return res.sendStatus(200);

  let cleanPath = req.url.replace(/^\//, '');

  if (!cleanPath || cleanPath === '') {
    return res.status(200).send('🚀 ¡Proxy de Pruebas Activo en Vercel!');
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
    const r = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Accept': req.headers['accept'] || '*/*',
        'Accept-Encoding': 'identity'
      },
      follow: 20
    });

    res.status(r.status);
    r.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'access-control-allow-origin', 'content-security-policy'].includes(key.toLowerCase())) {
        res.setHeader(key.toLowerCase(), value);
      }
    });
    res.setHeader('Access-Control-Allow-Origin', '*');
    const text = await r.text();
    res.send(text);
  } catch (e) {
    res.status(500).send(`Error: ${e.message}`);
  }
});

module.exports = app;
