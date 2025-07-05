import { Router } from 'express';
import multer from 'multer';
import { createCloudinaryStorage } from '../utils/Cloudniarystorage.js';
import cloudinary from '../utils/cloudinary.js';

const router = Router();

// Use Cloudinary storage, folder: sahas_carousel
const upload = multer({ storage: createCloudinaryStorage('sahas_carousel') });

/**
 * @route POST /carousel
 * @desc Upload multiple images to Cloudinary
 */
router.post('/carousel', upload.array('images'), (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedImages = files.map(file => ({
      url: file.path,                 // Full Cloudinary URL
      public_id: file.filename,       // public_id for deletion
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
 * @route GET /carousel
 * @desc Get list of images directly from Cloudinary (no database)
 */
router.get('/carousel', async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression('folder:sahas_carousel')
      .sort_by('created_at', 'desc')
      .max_results(100) // you can adjust this
      .execute();

    const images = result.resources.map(item => ({
      url: item.secure_url,
      public_id: item.public_id,
    }));

    console.log('Fetched Images:', images);

    res.status(200).json(images);
  } catch (err) {
    console.error('Failed to fetch carousel images:', err);
    res.status(500).json({ message: 'Failed to fetch carousel images' });
  }
});

/**
 * @route DELETE /carousel/:publicId
 * @desc Delete image from Cloudinary by public_id
 */
router.delete('/carousel/:publicId', async (req, res) => {
  try {
    const publicId = req.params.publicId;  // Example: sahas_carousel/filename

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return res.status(404).json({ message: 'Image not found or already deleted' });
    }

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Failed to delete image:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

export default router;
