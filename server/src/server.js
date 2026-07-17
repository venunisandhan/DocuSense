const env = require('./config/env');
const connectDB = require('./config/db');
const { ensureBucketExists } = require('./config/s3');
const logger = require('./utils/logger');
const app = require('./app');
const { execSync } = require('child_process');

require('./workers/rag.worker');

async function startServer() {
  await connectDB();
  await ensureBucketExists();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`Port ${env.PORT} in use — killing conflicting process and retrying in 1s...`);
      try {
        execSync(`kill -9 $(lsof -t -i:${env.PORT}) 2>/dev/null || true`, { stdio: 'ignore' });
      } catch (_) {}
      setTimeout(() => {
        server.close();
        app.listen(env.PORT, () => {
          logger.info(`Server running on port ${env.PORT} (after retry)`);
        });
      }, 1000);
    } else {
      logger.error(`Server error: ${err.message}`);
      process.exit(1);
    }
  });
}

startServer();