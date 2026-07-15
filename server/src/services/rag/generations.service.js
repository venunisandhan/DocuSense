
const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = require('../../config/bedrock');

const env = require('../../config/env');

const SYSTEM_PROMPT = `You are a document assistant. You must answer ONLY using the CONTEXT provided below, which is extracted from a company document. Do not use any outside knowledge, even if you know the answer.

If the context does not contain enough information to answer the question, respond with exactly this sentence and nothing else: "I don't have enough information in this document to answer that."

If the question is unrelated to the document's content (general knowledge, current events, math, real-world facts, or anything not about the document), respond with exactly this sentence and nothing else: "I'm a document assistant and can only answer questions about the uploaded documents."`;

async function generateAnswer(question, contextChunks) {
  const context = contextChunks.map((c, i) => `[Excerpt ${i + 1}]\n${c.text}`).join('\n\n');

  const command = new InvokeModelCommand({
    modelId: env.BEDROCK_GENERATION_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `CONTEXT:\n${context}\n\nQUESTION: ${question}`,
        },
      ],
    }),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  return responseBody.content[0].text;
}

module.exports = { generateAnswer, SYSTEM_PROMPT };