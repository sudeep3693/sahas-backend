import { Router } from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import { createCloudinaryStorage } from '../utils/Cloudniarystorage.js';

const router = Router();

// Multer + Cloudinary storage configured for 'sahas_notice' folder
const upload = multer({ storage: createCloudinaryStorage('sahas_notice') });

// POST / - Upload multiple notice images
router.post('/', upload.array('images'), (req, res) => {
  try {
    const files = req.files;
    const descriptions = Array.isArray(req.body.descriptions)
      ? req.body.descriptions
      : [req.body.descriptions];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Return array of uploaded image URLs and public IDs
    const uploadedImages = files.map(f => ({
      url: f.path,
      publicId: f.filename || f.public_id,
    }));

    console.log('Descriptions:', descriptions);
    console.log('Uploaded images:', uploadedImages);

    // TODO: Save images & descriptions info to DB if needed

    return res.status(200).json({ message: 'Images uploaded successfully', uploadedImages });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed on server' });
  }
});

// GET / - Return list of notice images (fetch from DB ideally)
router.get('/', async (req, res) => {
  try {
    // TODO: Fetch notice images from your database
    const noticeImages = [];
    console.log('Successfully fetched notice images');
    res.status(200).json(noticeImages);
  } catch (err) {
    console.error('Failed to fetch notice images:', err);
    res.status(500).json({ error: 'Failed to fetch notice images' });
  }
});

// DELETE /:publicId - Delete notice image by Cloudinary public ID
router.delete('/:publicId', async (req, res) => {
  try {
    const publicId = req.params.publicId; // e.g. "sahas_notice/1234567890-filename"

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
