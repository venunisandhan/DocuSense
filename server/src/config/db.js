
const mongoose = require('mongoose');

const env = require('./env');

const logger = require('../utils/logger');

const ensureVectorIndex = require('./ensureVectorIndex');

async function connectDB() {
    try{
        await mongoose.connect(env.MONGO_URI);
        logger.info("MongoDB connected");
        await ensureVectorIndex();
    }catch(err){
        logger.error('MongoDB connection failed',{error:err.message});
        process.exit(1);
    }
}

module.exports = connectDB;