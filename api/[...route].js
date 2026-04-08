require('dotenv/config');

const { handle } = require('@hono/node-server/vercel');

let cachedHandler;

module.exports = async (req, res) => {
  if (!cachedHandler) {
    const { createApp } = await import('../apps/api/dist/src/app.js');
    cachedHandler = handle(createApp());
  }

  return cachedHandler(req, res);
};
