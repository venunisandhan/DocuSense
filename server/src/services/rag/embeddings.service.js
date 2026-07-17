const ai = require('../../config/gemini');
const env = require('../../config/env');

async function embedText(text) {
  const response = await ai.models.embedContent({
    model: env.GEMINI_EMBEDDING_MODEL,
    contents: text,
    config: {
      outputDimensionality: 1024
    }
  });

  return response.embeddings[0].values;
}

module.exports = { embedText };