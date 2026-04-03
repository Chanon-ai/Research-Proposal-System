const redis = require('redis');

function parseBooleanEnv(value, defaultValue) {
  if (typeof value !== 'string') return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
}

class RedisClient {
  constructor() {
    this.client = null;
    this.connectionErrorLogged = false;

    const hasExplicitConfig = Boolean(
      (process.env.REDIS_URL && process.env.REDIS_URL.trim()) ||
      (process.env.REDIS_HOST && process.env.REDIS_HOST.trim()) ||
      (process.env.REDIS_PORT && process.env.REDIS_PORT.trim())
    );

    this.enabled = parseBooleanEnv(process.env.REDIS_ENABLED, hasExplicitConfig);

    if (!this.enabled) {
      console.log('[redis] Disabled (set REDIS_ENABLED=true with REDIS_HOST/REDIS_PORT or REDIS_URL to enable).');
      return;
    }

    const host = (process.env.REDIS_HOST || '127.0.0.1').trim();
    const rawPort = Number(process.env.REDIS_PORT || 6379);
    const port = Number.isInteger(rawPort) && rawPort > 0 ? rawPort : 6379;
    const url = process.env.REDIS_URL && process.env.REDIS_URL.trim();

    const options = {
      socket: {
        host,
        port,
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries >= 3) return false;
          return Math.min((retries + 1) * 250, 1000);
        }
      }
    };

    if (url) {
      options.url = url;
    }

    if (process.env.REDIS_PASSWORD) {
      options.password = process.env.REDIS_PASSWORD;
    }

    this.client = redis.createClient(options);
    this.client.on('error', (error) => {
      if (!this.connectionErrorLogged) {
        console.error('Redis client error:', error);
        this.connectionErrorLogged = true;
      }
    });

    this.connect();
  }

  isAvailable() {
    return Boolean(this.enabled && this.client && this.client.isOpen);
  }

  async connect() {
    if (!this.client) return;

    try {
      await this.client.connect();
      this.connectionErrorLogged = false;
      console.log('Redis connected');
    } catch (error) {
      if (!this.connectionErrorLogged) {
        console.warn('[redis] Redis unavailable, continuing without cache.');
        console.error('Redis connection failed:', error);
        this.connectionErrorLogged = true;
      }
    }
  }

  async get(key) {
    if (!this.isAvailable()) return null;

    try {
      return await this.client.get(key);
    } catch (error) {
      console.error(`Error fetching key ${key} from Redis:`, error);
      return null;
    }
  }

  async setEx(key, ttl, value) {
    if (!this.isAvailable()) return false;

    try {
      await this.client.setEx(key, ttl, value);
      return true;
    } catch (error) {
      console.error(`Error setting key ${key} in Redis:`, error);
      return false;
    }
  }

  async delete(key) {
    if (!this.isAvailable()) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Error deleting key ${key} from Redis:`, error);
      return false;
    }
  }

  async flushAll() {
    if (!this.isAvailable()) return false;

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Error flushing Redis cache:', error);
      return false;
    }
  }
}

module.exports = new RedisClient();
