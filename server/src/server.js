const env = require('./config/env');

const connectDB = require('./config/db');

const logger = require('./utils/logger');

const app = require('./app');

async function startServer() {
  await connectDB();
  app.listen(env.PORT, ()=>{
    logger.info(`Server running on port ${env.PORT}`);
  });
}

startServer();