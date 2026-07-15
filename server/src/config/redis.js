
const IORedis = require('ioredis');

const env = require('./env');

const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

module.exports = redisConnection;