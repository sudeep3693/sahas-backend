import { Router } from 'express';
import multer from 'multer';
import { createCloudinaryStorage } from '../utils/cloudinaryStorageFactory.js'; // your helper
import cloudinary from '../utils/cloudinary.js';

const router = Router();

// Multer + Cloudinary Storage for gallery images
const upload = multer({ storage: createCloudinaryStorage('sahas_gallery') });

// POST / - Upload multiple gallery images
router.post('/', upload.array('images'), (req, res) => {
  try {
    const files = req.files;
    const descriptions = Array.isArray(req.body.descriptions)
      ? req.body.descriptions
      : [req.body.descriptions];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // URLs & public IDs of uploaded images
    const uploadedImages = files.map(f => ({
      url: f.path,
      publicId: f.filename || f.public_id,
    }));

    console.log('Descriptions:', descriptions);
    console.log('Uploaded images:', uploadedImages);

    // TODO: Save uploadedImages info & descriptions to DB for retrieval later

    return res.status(200).json({ message: 'Images uploaded successfully', uploadedImages });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed on server' });
  }
});

// GET / - List all gallery images
router.get('/', async (req, res) => {
  try {
    // TODO: Fetch gallery image URLs and metadata from your DB
    // For now, return empty array or static example
    const galleryImages = [];
    console.log('Successfully fetched gallery images');
    res.status(200).json(galleryImages);
  } catch (err) {
    console.error('Failed to fetch gallery images:', err);
    res.status(500).json({ error: 'Failed to fetch gallery images' });
  }
});

// DELETE /:publicId - Delete gallery image by Cloudinary public ID
router.delete('/:publicId', async (req, res) => {
  try {
    const publicId = req.params.publicId; // e.g. "sahas_gallery/1234567890-filename"

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return res.status(404).json({ message: 'Image not found or already deleted' });
    }

    // TODO: Remove image record from DB if you store it

    return res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Failed to delete image:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

export default router;
