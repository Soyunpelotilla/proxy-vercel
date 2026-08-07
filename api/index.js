const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const app = express();

app.use(async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') return res.sendStatus(200);

  let cleanPath = req.url.replace(/^\//, '');
  if (!cleanPath) return res.status(200).send('🚀 Proxy Activo');

  let targetUrl = '';
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    targetUrl = cleanPath;
  } else if (/^https?:\/([^/])/.test(cleanPath)) {
    targetUrl = cleanPath.replace(/^https?:\//, m => m + '/');
  } else if (cleanPath.startsWith('ipfs/') || cleanPath.startsWith('ipns/')) {
    targetUrl = `https://ipfs.io/${cleanPath}`;
  } else {
    targetUrl = `https://${cleanPath}`;
  }

  try {
    const r = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*',
        'Accept-Encoding': 'identity'
      },
      follow: 20
    });

    const contentType = r.headers.get('content-type') || '';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(r.status);

    if (contentType.includes('text/html')) {
      const html = await r.text();
      const $ = cheerio.load(html);
      const tabla = $('.tablaPrincipal').toString();
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.send(tabla || html);
    } else {
      r.headers.forEach((value, key) => {
        if (!['content-encoding', 'transfer-encoding', 'access-control-allow-origin', 'content-security-policy'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      const buffer = await r.buffer();
      res.send(buffer);
    }
  } catch (e) {
    res.status(500).send(`Error: ${e.message}`);
  }
});

module.exports = app;
