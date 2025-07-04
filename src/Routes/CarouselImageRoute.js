import { Router } from 'express';
import multer from 'multer';
import { createCloudinaryStorage } from '../utils/cloudinaryStorageFactory.js'; // your factory
import cloudinary from '../utils/cloudinary.js';

const router = Router();

// Use Cloudinary storage, folder: sahas_carousel
const upload = multer({ storage: createCloudinaryStorage('sahas_carousel') });

// POST /carousel - Upload multiple images
router.post('/carousel', upload.array('images'), (req, res) => {
  try {
    const files = req.files;
    const descriptions = Array.isArray(req.body.descriptions)
      ? req.body.descriptions
      : [req.body.descriptions];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Files now have a 'path' property with Cloudinary URLs
    const uploadedUrls = files.map(f => f.path);

    console.log('Descriptions:', descriptions);
    console.log('Files URLs:', uploadedUrls);

    return res.status(200).json({ message: 'Images uploaded successfully', images: uploadedUrls });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed on server' });
  }
});

// GET /carousel - Return list of uploaded images (URLs stored in your DB)
// Since you no longer store files locally, you should store URLs in DB and fetch from there.
// For demo, this just returns empty array or you can adjust to return DB results.

router.get('/carousel', async (req, res) => {
  try {
    // TODO: Replace this with fetching image URLs from your database collection for carousel images
    // Example: const images = await CarouselModel.find().select('imageUrl -_id');
    // For now, return empty array:
    const images = [];
    console.log('Successfully fetched carousel images');
    res.status(200).json(images);
  } catch (err) {
    console.error('Failed to fetch carousel images:', err);
    res.status(500).json({ error: 'Failed to fetch carousel images' });
  }
});

// DELETE /carousel/:publicId - Delete image from Cloudinary by public ID
router.delete('/carousel/:publicId', async (req, res) => {
  try {
    const publicId = req.params.publicId; // Cloudinary public ID, e.g., "sahas_carousel/1234567890-filename"
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return res.status(404).json({ message: 'Image not found or already deleted' });
    }

    // TODO: Also delete image record from your DB if you store URLs/publicIds there

    return res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Failed to delete image:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

export default router;
