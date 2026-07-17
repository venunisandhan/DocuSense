const documentService = require('../services/document.service');
const { embedText } = require('../services/rag/embeddings.service');
const { generateAnswer } = require('../services/rag/generations.service');
const DocumentChunk = require('../models/DocumentChunk');
const ChatLog = require('../models/ChatLog');
const ApiError = require('../utils/ApiError');
const accessService = require('../services/access.service');
const env = require('../config/env');

async function getRagStatus(req, res) {
  const document = await documentService.getDocumentForUser(req.params.id, req.user);
  res.status(200).json({ success: true, data: { status: document.ragStatus || 'NOT_STARTED' } });
}

async function chat(req, res) {
  const { question } = req.body;
  const documentId = req.params.id;

  const document = await documentService.getDocumentForUser(documentId, req.user);
  
  if (document.ragStatus !== 'READY') {
    throw new ApiError(400, 'Document is not fully processed yet', 'RAG_NOT_READY');
  }

  const questionEmbedding = await embedText(question);

  const threshold = parseFloat(env.VECTOR_SIMILARITY_THRESHOLD || '0.7');

  const chunks = await DocumentChunk.aggregate([
    {
      $vectorSearch: {
        index: 'chunk_vector_index',
        path: 'embedding',
        queryVector: questionEmbedding,
        numCandidates: 100,
        limit: 5,
        filter: { document: document._id }
      }
    },
    { $addFields: { score: { $meta: 'vectorSearchScore' } } },
    { $match: { score: { $gte: threshold } } }
  ]);

  const answerText = await generateAnswer(question, chunks);

  const wasAnswerable = !(
    answerText.includes("I don't have enough information") ||
    answerText.includes("I'm a document assistant")
  );

  const chatLog = await ChatLog.create({
    document: documentId,
    askedBy: req.user.id,
    question,
    answer: answerText,
    wasAnswerable,
  });

  res.status(200).json({
    success: true,
    data: {
      answer: answerText,
      wasAnswerable,
      chatId: chatLog._id
    }
  });
}

async function chatHistory(req, res) {
  const documentId = req.params.id;
  await documentService.getDocumentForUser(documentId, req.user);

  const history = await ChatLog.find({ document: documentId, askedBy: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({ success: true, data: { history } });
}

async function globalChat(req, res) {
  const { question } = req.body;
  const accessibleIds = await accessService.listAccessibleDocumentIds(req.user.id);

  if (req.user.role === 'HR') {
    const hrDocs = await documentService.listMyUploads(req.user.id);
    hrDocs.forEach(d => accessibleIds.push(d._id.toString()));
  }

  const uniqueAccessibleIds = [...new Set(accessibleIds)];

  if (uniqueAccessibleIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: { answer: "I'm sorry, you do not have access to any documents to search against.", wasAnswerable: false }
    });
  }

  const questionEmbedding = await embedText(question);
  const threshold = parseFloat(env.VECTOR_SIMILARITY_THRESHOLD || '0.7');

  const chunks = await DocumentChunk.aggregate([
    {
      $vectorSearch: {
        index: 'chunk_vector_index',
        path: 'embedding',
        queryVector: questionEmbedding,
        numCandidates: 100,
        limit: 5,
        filter: { document: { $in: uniqueAccessibleIds } }
      }
    },
    { $addFields: { score: { $meta: 'vectorSearchScore' } } },
    { $match: { score: { $gte: threshold } } }
  ]);

  const answerText = await generateAnswer(question, chunks);
  const wasAnswerable = !(
    answerText.includes("I don't have enough information") ||
    answerText.includes("I'm a document assistant")
  );

  res.status(200).json({
    success: true,
    data: { answer: answerText, wasAnswerable }
  });
}

module.exports = { getRagStatus, chat, chatHistory, globalChat };
