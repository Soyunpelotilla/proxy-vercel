const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use((req, res) => {
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
    targetUrl = cleanPath.replace(/^https?:\//, match => match + '/');
  } else {
    targetUrl = `https://${cleanPath}`;
  }

  let fetchOptions = {
    method: req.method,
    headers: {
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
      'Accept': req.headers['accept'] || '*/*',
      'Accept-Encoding': 'identity'
    },
    follow: 20
  };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    fetchOptions.body = req;
  }

  fetch(targetUrl, fetchOptions)
    .then(async r => {
      res.status(r.status);
      r.headers.forEach((value, key) => {
        if (!['content-encoding', 'transfer-encoding', 'access-control-allow-origin', 'content-security-policy'].includes(key.toLowerCase())) {
          res.setHeader(key.toLowerCase(), value);
        }
      });
      res.setHeader('Access-Control-Allow-Origin', '*');
      const buffer = await r.buffer();
      res.send(buffer);
    })
    .catch(e => {
      res.status(500).send(`Error en Vercel Proxy: ${e.message}`);
    });
});

module.exports = app;
