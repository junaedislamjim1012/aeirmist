import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      // In development/preview without Redis, we can fallback to an in-memory mock or 
      // just log a warning. For a production-ready system, a missing REDIS_URL should be an error.
      console.warn('REDIS_URL is not defined. Falling back to in-memory/limited mode.');
      // For the purpose of this implementation, we assume Redis is required for "Scalable Architecture".
      // We will provide a dummy one if it's not there to keep the app running in non-prod environments.
      // But we will use the environment variable if present.
      redisClient = new Redis(redisUrl || 'redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false
      });
    } else {
      redisClient = new Redis(redisUrl);
    }

    redisClient.on('error', (err) => {
      console.error('Redis Connection Error:', err);
    });
  }
  return redisClient;
}
