import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Document from '../Model/DocumentModel.js';
import logger from '../utils/logger.js';
import { createCloudinaryStorage } from '../utils/Cloudniarystorage.js';
import { normalizeCloudinaryDocumentUrl, buildPdfFilename, extractCloudinaryPublicId } from '../utils/documentUrl.js';
import cloudinary from '../utils/cloudinary.js';

const router = Router();
const upload = multer({
  storage: createCloudinaryStorage('sahas_documents', 'raw'),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = ext === '.pdf';

    if (isPdfMime || isPdfExt) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files (.pdf) are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB maximum
  },
});

// Helper to fetch file bytes from Cloudinary or local storage
async function fetchDocumentBuffer(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Document file path is missing or invalid');
  }

  if (/^https?:\/\//i.test(filePath)) {
    let response = await fetch(filePath);
    let cldError = response.headers?.get?.('x-cld-error') || null;

    // If Cloudinary URL failed, try swapping resource types and signed URLs
    if (!response.ok && filePath.includes('cloudinary.com')) {
      const candidateUrls = [];

      // 1. Try swapping raw/upload and image/upload
      if (filePath.includes('/raw/upload/')) {
        candidateUrls.push(filePath.replace('/raw/upload/', '/image/upload/'));
      } else if (filePath.includes('/image/upload/')) {
        candidateUrls.push(filePath.replace('/image/upload/', '/raw/upload/'));
      }

      // 2. Try signed URLs via Cloudinary SDK
      const publicId = extractCloudinaryPublicId(filePath);
      if (publicId) {
        try {
          const rawSigned = cloudinary.utils.url(publicId, {
            resource_type: 'raw',
            sign_url: true,
            secure: true,
          });
          candidateUrls.push(rawSigned);

          const imagePublicId = publicId.replace(/\.pdf$/i, '');
          const imageSigned = cloudinary.utils.url(imagePublicId, {
            resource_type: 'image',
            format: 'pdf',
            sign_url: true,
            secure: true,
          });
          candidateUrls.push(imageSigned);
        } catch (e) {
          logger.warn('Failed to generate signed URL fallback for Cloudinary', e);
        }
      }

      // Try each candidate URL until one succeeds
      for (const altUrl of candidateUrls) {
        try {
          const altResponse = await fetch(altUrl);
          if (altResponse.ok) {
            response = altResponse;
            break;
          }
          if (altResponse.headers?.get?.('x-cld-error')) {
            cldError = altResponse.headers.get('x-cld-error');
          }
        } catch (err) {
          logger.warn(`Failed fetching alt URL: ${altUrl}`, err);
        }
      }
    }

    if (!response.ok) {
      const extraInfo = cldError ? ` (${cldError})` : '';
      const actionHint = response.status === 401 && filePath.includes('cloudinary.com')
        ? ' - Cloudinary blocked PDF delivery. Please enable "Allow delivery of PDF and ZIP files" in Cloudinary Console (Settings > Security).'
        : '';
      throw new Error(`Failed to fetch file from remote storage (HTTP ${response.status}${extraInfo})${actionHint}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // Local filesystem lookup
  const cleanPath = filePath.replace(/^\/+/, '');
  const candidatePaths = [
    path.join(process.cwd(), cleanPath),
    path.join(process.cwd(), 'pdf', path.basename(cleanPath)),
    path.join(process.cwd(), '..', cleanPath),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate);
    }
  }

  throw new Error(`Local file not found for path: ${filePath}`);
}

// Upload document
router.post('/save', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      logger.error('Document upload validation error', err);
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { heading, category } = req.body;

    if (!['reports', 'downloads'].includes(category)) {
      return res.status(400).json({ message: 'Category must be reports or downloads' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    const originalFileName = buildPdfFilename(req.file.originalname || req.body.fileName || heading || 'document.pdf');
    const fileUrl = normalizeCloudinaryDocumentUrl(req.file.path || req.file.secure_url);
    const document = new Document({
      heading,
      category,
      filePath: fileUrl,
      fileName: originalFileName,
    });

    await document.save();
    logger.info(`Document saved: "${heading}" [${category}] → ${document.filePath} (${document.fileName})`);
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

// Stream document for viewing in browser (disposition: inline)
router.get('/view/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const safeFilename = buildPdfFilename(doc.fileName || doc.heading || 'document');
    const fileBuffer = await fetchDocumentBuffer(doc.filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.end(fileBuffer);
  } catch (error) {
    logger.error('Error serving document for viewing', error);
    res.status(500).json({ message: 'Failed to display PDF document', error: error.message || String(error) });
  }
});

// Stream document for downloading (disposition: attachment)
router.get('/download/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const safeFilename = buildPdfFilename(doc.fileName || doc.heading || 'document');
    const fileBuffer = await fetchDocumentBuffer(doc.filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.end(fileBuffer);
  } catch (error) {
    logger.error('Error downloading document', error);
    res.status(500).json({ message: 'Failed to download PDF document', error: error.message || String(error) });
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
        // Delete raw asset
        try {
          await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'raw' });
        } catch (e) {
          logger.warn('Cloudinary raw destroy warning', e);
        }
        // Also attempt image delete in case legacy file was stored under image resource_type
        try {
          await cloudinary.uploader.destroy(cloudinaryPublicId.replace(/\.pdf$/i, ''), { resource_type: 'image' });
        } catch (e) {
          logger.warn('Cloudinary image destroy warning', e);
        }
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

