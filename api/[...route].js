require('dotenv/config');

const { handle } = require('@hono/node-server/vercel');

let cachedHandler;

module.exports = async (req, res) => {
  if (req.url === '/login') {
    req.url = '/api/auth/login';
  } else if (req.url === '/auth/login') {
    req.url = '/api/auth/login';
  } else if (typeof req.url === 'string' && !req.url.startsWith('/api/') && req.url !== '/api') {
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
  }

  if (!cachedHandler) {
    const { createApp } = await import('../apps/api/dist/src/app.js');
    cachedHandler = handle(createApp());
  }

  return cachedHandler(req, res);
};
