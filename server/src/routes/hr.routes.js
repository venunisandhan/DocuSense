const express = require('express');

const hrController = require('../controllers/hr.controller');

const authenticate = require('../middlewares/authenticate');

const authorize = require('../middlewares/authorize');

const validate = require('../middlewares/validate');

const asyncHandler = require('../utils/asyncHandler');
const {
  searchDirectorySchema,
  createGroupSchema,
  updateGroupSchema,
} = require('../validators/hr.schema');

const router = express.Router();

router.use(authenticate, authorize('HR'));

router.get('/directory/search', validate(searchDirectorySchema), asyncHandler(hrController.searchDirectory));

router.post('/groups', validate(createGroupSchema), asyncHandler(hrController.createGroup));

router.get('/groups', asyncHandler(hrController.listGroups));

router.get('/groups/:id', asyncHandler(hrController.getGroup));

router.patch('/groups/:id', validate(updateGroupSchema), asyncHandler(hrController.updateGroup));

router.delete('/groups/:id', asyncHandler(hrController.deleteGroup));

module.exports = router;