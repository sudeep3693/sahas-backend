import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Document from '../Model/DocumentModel.js';
import logger from '../utils/logger.js';
import { createCloudinaryStorage } from '../utils/Cloudniarystorage.js';
import { normalizeCloudinaryDocumentUrl } from '../utils/documentUrl.js';

const router = Router();
const upload = multer({
  storage: createCloudinaryStorage('sahas_documents', 'raw'),
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// Upload document
router.post('/save', upload.single('file'), async (req, res) => {
  try {
    const { heading, category } = req.body;

    if (!['reports', 'downloads'].includes(category)) {
      return res.status(400).json({ message: 'Category must be reports or downloads' });
    }

    if (!req.file) return res.status(400).json({ message: 'PDF file is required' });

    const fileUrl = normalizeCloudinaryDocumentUrl(req.file.path || req.file.secure_url);
    const document = new Document({
      heading,
      category,
      filePath: fileUrl,
    });

    await document.save();
    logger.info(`Document saved: "${heading}" [${category}] → ${document.filePath}`);
    res.status(201).json({ message: 'Document saved successfully', document });
  } catch (error) {
    logger.error('Error saving document', error);
    res.status(500).json({ message: 'Failed to save document', error: error.message || String(error) });
  }
});

// Fetch all documents
router.get('/all', async (req, res) => {
  try {
    const documents = await Document.find().sort({ uploadedAt: -1 });
    const normalizedDocuments = documents.map((doc) => ({
      ...doc.toObject(),
      filePath: normalizeCloudinaryDocumentUrl(doc.filePath),
    }));
    logger.info(`Documents fetched: ${documents.length} record(s)`);
    res.status(200).json(normalizedDocuments);
  } catch (error) {
    logger.error('Error fetching documents', error);
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message || String(error) });
  }
});

// Fetch by category
router.get('/category/:category', async (req, res) => {
  try {
    const docs = await Document.find({ category: req.params.category }).sort({ uploadedAt: -1 });
    const normalizedDocs = docs.map((doc) => ({
      ...doc.toObject(),
      filePath: normalizeCloudinaryDocumentUrl(doc.filePath),
    }));
    logger.info(`Documents fetched for category "${req.params.category}": ${docs.length} record(s)`);
    res.status(200).json(normalizedDocs);
  } catch (error) {
    logger.error('Error fetching documents by category', error);
    res.status(500).json({ message: 'Error fetching documents by category', error: error.message || String(error) });
  }
});

// Delete document
router.delete('/delete/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.filePath && doc.filePath.includes('cloudinary.com')) {
      const publicId = decodeURIComponent(doc.filePath.split('/upload/').pop() || '').replace(/\?.*$/, '');
      if (publicId) {
        const cloudinaryPublicId = publicId.includes('/')
          ? publicId.replace(/^.*?\/sahas_documents\//, 'sahas_documents/')
          : `sahas_documents/${publicId}`;

        const { default: cloudinary } = await import('../utils/cloudinary.js');
        await cloudinary.uploader.destroy(cloudinaryPublicId);
      }
    } else if (doc.filePath && doc.filePath.startsWith('/pdf/')) {
      const localFilePath = path.join(process.cwd(), doc.filePath.replace(/^\//, ''));
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }

    await Document.findByIdAndDelete(req.params.id);
    logger.info(`Document deleted: ${req.params.id}`);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Error deleting document', error);
    res.status(500).json({ message: 'Failed to delete document', error: error.message || String(error) });
  }
});

export default router;
