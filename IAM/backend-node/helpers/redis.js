const redis = require("redis");

class RedisClient {
    constructor() {
        const host = process.env.REDIS_HOST || '127.0.0.1';
        const rawPort = Number(process.env.REDIS_PORT || 6379);
        const port = Number.isInteger(rawPort) && rawPort > 0 ? rawPort : 6379;

        const options = {
            socket: { host, port }
        };

        if (process.env.REDIS_PASSWORD) {
            options.password = process.env.REDIS_PASSWORD;
        }

        this.client = redis.createClient(options);
        this.client.on('error', (error) => {
            console.error("Redis client error:", error);
        });
        this.connect();
    }

    async connect() {
        try {
            await this.client.connect();
            console.log("Redis connected");
        } catch (error) {
            console.error("Redis connection failed:", error);
        }
    }

    async get(key) {
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error(`Error fetching key ${key} from Redis:`, error);
            return null;
        }
    }

    async setEx(key, ttl, value) {
        try {
            await this.client.setEx(key, ttl, value);
        } catch (error) {
            console.error(`Error setting key ${key} in Redis:`, error);
        }
    }

    async delete(key) {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error(`Error deleting key ${key} from Redis:`, error);
        }
    }
}

// ใช้ Singleton เพื่อให้ Redis Client มีเพียงอินสแตนซ์เดียวในระบบ
module.exports = new RedisClient();
