import express from 'express';
import{
    uploadDocument,
    getDocuments,
    getDocument,
    updateDocument,
    deleteDocument,
} from '../controllers/documentController.js';
import protect from '../middleware/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

// Protected routes for document management
router.use(protect);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.put('/:id',updateDocument);
router.delete('/:id', deleteDocument);

export default router;