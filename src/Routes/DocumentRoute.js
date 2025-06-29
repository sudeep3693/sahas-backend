import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Document from '../Model/DocumentModel.js';

const router = Router();

// Storage config for PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/documents'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

/**
 * @desc Upload new document
 * @route POST /documents/save
 */
router.post('/save', upload.single('file'), async (req, res) => {
  try {
    const { heading, category } = req.body;
    if (!req.file) return res.status(400).json({ message: 'PDF file is required' });

    const document = new Document({
      heading,
      category,
      filePath: req.file.filename
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
 * @desc Delete document and its file
 * @route DELETE /documents/delete/:id
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    const { filePath } = req.body;
    const absolutePath = path.join(path.resolve(), 'uploads/documents', filePath);

    await Document.findByIdAndDelete(req.params.id);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

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
