import { Router } from 'express';
import multer from 'multer';
import { createCloudinaryStorage } from '../utils/Cloudniarystorage.js';
import cloudinary from '../utils/cloudinary.js';

const router = Router();
const upload = multer({ storage: createCloudinaryStorage('sahas_carousel') });

/**
 * @route POST /images/carousel
 * @desc Upload images to Cloudinary
 */
router.post('/carousel', upload.array('images'), (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedImages = files.map(file => ({
      url: file.path,                      // Full Cloudinary URL
      public_id: file.filename.includes('sahas_carousel')
        ? file.filename
        : `sahas_carousel/${file.filename}`,  // Ensure full public_id
    }));

    console.log('Uploaded Images:', uploadedImages);

    return res.status(200).json({
      message: 'Images uploaded successfully',
      images: uploadedImages,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed on server' });
  }
});

/**
 * @route GET /images/carousel
 * @desc Get images from Cloudinary
 */
router.get('/carousel', async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression('folder:sahas_carousel')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const images = result.resources.map(item => ({
      url: item.secure_url,
      public_id: item.public_id,
    }));

    res.status(200).json(images);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch images' });
  }
});

/**
 * @route DELETE /images/carousel/:publicId
 * @desc Delete image by public_id
 */
router.delete('/carousel/:publicId', async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return res.status(404).json({ message: 'Image not found or already deleted' });
    }

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

export default router;
