const express = require('express');

const documentController = require('../controllers/document.controller');
const ragController = require('../controllers/rag.controller');
const accessController = require('../controllers/access.controller');

const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');

const {
  uploadDocumentSchema,
  documentIdParamSchema,
  updateGuidelinesSchema,
} = require('../validators/document.schema');

const { chatSchema, ragParamSchema, globalChatSchema } = require('../validators/rag.schema');

const {
  grantAccessSchema,
  revokeAccessParamSchema,
  documentIdParamSchema: accessDocumentIdParamSchema,
} = require('../validators/access.schema');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  authorize('HR'),
  upload.single('file'),
  validate(uploadDocumentSchema),
  asyncHandler(documentController.upload)
);

router.get('/', asyncHandler(async (req, res) => {
  if (req.user.role === 'HR') {
    return documentController.listMyUploads(req, res);
  } else {
    return documentController.listMyShared(req, res);
  }
}));

router.patch(
  '/:id/guidelines',
  authorize('HR'),
  validate(updateGuidelinesSchema),
  asyncHandler(documentController.updateGuidelines)
);

router.delete(
  '/:id',
  authorize('HR'),
  validate(documentIdParamSchema),
  asyncHandler(documentController.deleteDocument)
);

router.post(
  '/:id/access',
  authorize('HR'),
  validate(grantAccessSchema),
  asyncHandler(accessController.grantAccess)
);
router.get(
  '/:id/access',
  authorize('HR'),
  validate(accessDocumentIdParamSchema),
  asyncHandler(accessController.listAccess)
);
router.delete(
  '/:id/access/:accessId',
  authorize('HR'),
  validate(revokeAccessParamSchema),
  asyncHandler(accessController.revokeAccess)
);

router.get('/mine', authorize('EMPLOYEE'), asyncHandler(documentController.listMyShared));

router.post('/query', validate(globalChatSchema), asyncHandler(ragController.globalChat));

router.get('/:id', validate(documentIdParamSchema), asyncHandler(documentController.getDocument));
router.get(
  '/:id/download',
  validate(documentIdParamSchema),
  asyncHandler(documentController.getDownloadUrl)
);

router.get('/:id/rag-status', validate(ragParamSchema), asyncHandler(ragController.getRagStatus));
router.post('/:id/chat', validate(chatSchema), asyncHandler(ragController.chat));
router.get('/:id/chat/history', validate(ragParamSchema), asyncHandler(ragController.chatHistory));

module.exports = router;
