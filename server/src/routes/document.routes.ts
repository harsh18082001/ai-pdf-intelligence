import { Router } from 'express';
import { uploadPdf } from '../middlewares/upload.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  downloadDocument,
  deleteDocument,
} from '../controllers/document.controller.js';

const router = Router();

router.post('/', uploadPdf, asyncHandler(uploadDocument));
router.get('/', asyncHandler(listDocuments));
router.get('/:id', asyncHandler(getDocument));
router.get('/:id/download', asyncHandler(downloadDocument));
router.delete('/:id', asyncHandler(deleteDocument));

export default router;
