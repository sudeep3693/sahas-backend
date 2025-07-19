import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Document from '../Model/DocumentModel.js';

const router = Router();

// Ensure pdf directory exists
const pdfDir = path.join(process.cwd(), 'pdf');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category; // "reports" or "downloads"
    const categoryDir = path.join(pdfDir, category);

    // Create category folder if missing
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    cb(null, categoryDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
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

    if (!req.file) return res.status(400).json({ message: 'PDF file is required' });

    const document = new Document({
      heading,
      category,
      // Save file path including category (for frontend)
      filePath: `/pdf/${category}/${req.file.filename}`,
    });

    await document.save();

    res.status(201).json({ message: 'Document saved successfully', document });
  } catch (error) {
    console.error('Error saving document:', error);
    res.status(500).json({ message: 'Failed to save document', error });
  }
});

// Fetch all documents
router.get('/all', async (req, res) => {
  try {
    const documents = await Document.find().sort({ uploadedAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents', error });
  }
});

// Fetch by category
router.get('/category/:category', async (req, res) => {
  try {
    const docs = await Document.find({ category: req.params.category }).sort({ uploadedAt: -1 });
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents by category', error });
  }
});

// Delete document
router.delete('/delete/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.filePath) {
      const filePath = path.join(process.cwd(), doc.filePath.replace(/^\//, '')); // remove leading slash
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document', error });
  }
});

export default router;
