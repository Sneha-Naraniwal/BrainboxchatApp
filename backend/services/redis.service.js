import Redis from 'ioredis';


const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: () => null, // Don't retry, just fail gracefully
    maxRetriesPerRequest: 0
});


redisClient.on('connect', () => {
    console.log('Redis connected');
})

redisClient.on('error', (err) => {
    console.log('Redis connection error (non-blocking):', err.message);
    // Don't throw, just log - app can work without Redis
})

export default redisClient;