import { createClient } from 'redis';


const redisClient = createClient();

redisClient.on('connect', () => {console.log('Connected to Redis');});
redisClient.on('error', (err) => console.error('Redis Client Error', err));

await redisClient.connect();

export default redisClient;
