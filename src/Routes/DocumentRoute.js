import { Router } from 'express';
import multer from 'multer';
import Document from '../Model/DocumentModel.js';
import { createCloudinaryStorage } from '../utils/cloudinaryStorageFactory.js';
import cloudinary from '../utils/cloudinary.js';
import path from 'path';

const router = Router();

// Multer + Cloudinary Storage for PDFs
// Make sure to allow 'pdf' in allowed_formats in your cloudinaryStorageFactory.js
const upload = multer({ storage: createCloudinaryStorage('sahas_documents') });

/**
 * @desc Upload new document (PDF)
 * @route POST /documents/save
 */
router.post('/save', upload.single('file'), async (req, res) => {
  try {
    const { heading, category } = req.body;

    if (!req.file) return res.status(400).json({ message: 'PDF file is required' });

    const document = new Document({
      heading,
      category,
      filePath: req.file.path,    // Cloudinary URL to PDF
      publicId: req.file.filename || req.file.public_id, // store public ID for deletion (depends on multer-storage-cloudinary version)
    });

    await document.save();

    res.status(201).json({ message: 'Document saved successfully', document });
  } catch (error) {
    console.error('Error saving document:', error);
    res.status(500).json({ message: 'Failed to save document', error });
  }
});

/**
 * @desc Get all documents
 * @route GET /documents/all
 */
router.get('/all', async (req, res) => {
  try {
    const documents = await Document.find().sort({ uploadedAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents', error });
  }
});

/**
 * @desc Delete document and its file from Cloudinary
 * @route DELETE /documents/delete/:id
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Delete file from Cloudinary using publicId
    if (doc.publicId) {
      await cloudinary.uploader.destroy(doc.publicId);
    }

    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document', error });
  }
});

/**
 * @desc Get documents by category
 * @route GET /documents/category/:category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const docs = await Document.find({ category: req.params.category });
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents by category', error });
  }
});

export default router;
