const multer = require('multer');

const env = require('../config/env');

const ApiError = require('../utils/ApiError');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new ApiError(400, 'Only PDF, DOCX, and TXT files are allowed', 'INVALID_FILE_TYPE'));
    }
    cb(null, true);
  },
});

module.exports = upload;