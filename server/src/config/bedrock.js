
const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');

const env = require('./env');

const bedrockClient = new BedrockRuntimeClient({ region: env.AWS_REGION });

module.exports = bedrockClient;