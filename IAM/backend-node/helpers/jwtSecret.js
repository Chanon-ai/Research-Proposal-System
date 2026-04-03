'use strict';

const crypto = require('crypto');

let cachedDevSecret = null;

function getJwtSecret() {
  const configured = String(process.env.JWT_SECRET || '').trim();
  if (configured) return configured;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }

  if (!cachedDevSecret) {
    cachedDevSecret = `dev-${crypto.randomBytes(32).toString('hex')}`;
    console.warn('[security] JWT_SECRET is missing, using ephemeral dev secret.');
  }

  return cachedDevSecret;
}

module.exports = {
  getJwtSecret
};
