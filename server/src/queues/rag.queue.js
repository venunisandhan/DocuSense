
const { Queue } = require('bullmq');

const redisConnection = require('../config/redis');

const ragQueue = new Queue('rag-processing', { connection: redisConnection });

module.exports = ragQueue;