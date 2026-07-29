import { Router } from 'express';
import { uploadPdf } from '../middlewares/upload.js';
import { asyncHandler } from '../utils/async-handler.js';
import { validate, idParamSchema } from '../middlewares/validation.js';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} from '../controllers/document.controller.js';

const router = Router();

// We need to validate req.params for endpoints that expect an ID
// But the validation middleware applies to req.body by default.
// Let's just use the controllers which parse the ID and throw 400 if invalid.

router.post('/', uploadPdf, asyncHandler(uploadDocument));
router.get('/', asyncHandler(listDocuments));
router.get('/:id', asyncHandler(getDocument));
router.delete('/:id', asyncHandler(deleteDocument));

export default router;
