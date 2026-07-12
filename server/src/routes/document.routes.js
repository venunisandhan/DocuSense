
const express = require('express');

const documentController = require('../controllers/document.controller');

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

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  authorize('HR'),
  upload.single('file'),
  validate(uploadDocumentSchema),
  asyncHandler(documentController.upload)
);

router.get('/', authorize('HR'), asyncHandler(documentController.listMyUploads));

router.get('/:id', authorize('HR'), validate(documentIdParamSchema), asyncHandler(documentController.getDocument));

router.get(
  '/:id/download',
  authorize('HR'),
  validate(documentIdParamSchema),
  asyncHandler(documentController.getDownloadUrl)
);

router.patch(
  '/:id/guidelines',
  authorize('HR'),
  validate(updateGuidelinesSchema),
  asyncHandler(documentController.updateGuidelines)
);

module.exports = router;