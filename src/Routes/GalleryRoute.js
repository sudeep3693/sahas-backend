import { Router } from 'express';
import multer from 'multer';
import { createCloudinaryStorage } from '../utils/Cloudniarystorage.js';
import cloudinary from '../utils/cloudinary.js';
import logger from '../utils/logger.js';

const router = Router();
const upload = multer({ storage: createCloudinaryStorage('sahas_gallery') });

/**
 * @route POST /gallery
 * @desc Upload multiple gallery images
 */
router.post('/', upload.array('images'), (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedImages = files.map(file => ({
      url: file.path,  // Cloudinary URL
      public_id: file.filename.includes('sahas_gallery')
        ? file.filename
        : `sahas_gallery/${file.filename}`,
    }));

    console.log('Uploaded Gallery Images:', uploadedImages);

    logger.info(`Gallery: ${uploadedImages.length} image(s) uploaded`);
    res.status(200).json({
      message: 'Gallery images uploaded successfully',
      images: uploadedImages,
    });
  } catch (err) {
    logger.error('Gallery upload error', err);
    res.status(500).json({ message: 'Gallery upload failed on server', error: err.message || String(err) });
  }
});

/**
 * @route GET /gallery
 * @desc Get all gallery images from Cloudinary
 */
router.get('/', async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression('folder:sahas_gallery')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const images = result.resources.map(item => ({
      url: item.secure_url,
    }));

    logger.info(`Gallery: ${images.length} image(s) fetched`);
    res.status(200).json(images);
  } catch (err) {
    logger.error('Gallery fetch error', err);
    res.status(500).json({ message: 'Failed to fetch gallery images', error: err.message || String(err) });
  }
});

/**
 * @route DELETE /gallery/:publicId
 * @desc Delete gallery image by public_id
 */
router.delete('/:publicId', async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return res.status(404).json({ message: 'Image not found or already deleted' });
    }

    logger.info(`Gallery image deleted: ${publicId}`);
    res.status(200).json({ message: 'Gallery image deleted successfully' });
  } catch (error) {
    logger.error('Gallery delete error', error);
    res.status(500).json({ message: 'Failed to delete gallery image', error: error.message || String(error) });
  }
});

export default router;
