const ai = require('../../config/gemini');
const env = require('../../config/env');

const SYSTEM_PROMPT = `You are a document assistant. You must answer ONLY using the CONTEXT provided below, which is extracted from a company document. Do not use any outside knowledge, even if you know the answer.

If the context does not contain enough information to answer the question, respond with exactly this sentence and nothing else: "I don't have enough information in this document to answer that."

If the question is unrelated to the document's content (general knowledge, current events, math, real-world facts, or anything not about the document), respond with exactly this sentence and nothing else: "I'm a document assistant and can only answer questions about the uploaded documents."`;

async function generateAnswer(question, contextChunks) {
  const context = contextChunks.map((c, i) => `[Excerpt ${i + 1}]\n${c.text}`).join('\n\n');
  const prompt = `CONTEXT:\n${context}\n\nQUESTION: ${question}`;

  const response = await ai.models.generateContent({
    model: env.GEMINI_GENERATION_MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2,
      maxOutputTokens: 500,
    }
  });

  return response.text;
}

module.exports = { generateAnswer, SYSTEM_PROMPT };