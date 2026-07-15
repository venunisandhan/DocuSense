
const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = require('../../config/bedrock');

const env = require('../../config/env');

async function embedText(text) {
  const command = new InvokeModelCommand({
    modelId: env.BEDROCK_EMBEDDING_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({ inputText: text }),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  return responseBody.embedding;
}

module.exports = { embedText };