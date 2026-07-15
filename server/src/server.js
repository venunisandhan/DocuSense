
const env = require('./config/env');

const connectDB = require('./config/db');

const { ensureBucketExists } = require('./config/s3');

const logger = require('./utils/logger');

const app = require('./app');


require('./workers/rag.worker');

async function startServer() {
  await connectDB();
  await ensureBucketExists();
  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

startServer();