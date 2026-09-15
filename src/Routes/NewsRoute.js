import { Router } from 'express';
import multer from 'multer';
import { createCloudinaryStorage } from '../utils/Cloudniarystorage.js';
import NewsModel from '../Model/NewsModel.js';
import cloudinary from '../utils/cloudinary.js';
import logger from '../utils/logger.js';

const router = Router();

// Multer + Cloudinary Storage
const upload = multer({ storage: createCloudinaryStorage('sahas_news') });

/**
 * @desc Save new news detail with image
 * @route POST /news/save
 */
router.post('/save', upload.single('image'), async (req, res) => {
  try {
    const { date, heading, detail } = req.body;

    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    const newsModel = new NewsModel({
      imageName: req.file.path,
      date,
      heading,
      newsDescription: detail,
    });

    await newsModel.save();
    logger.info(`News saved: "${newsModel.heading}" (id: ${newsModel._id})`);
    res.status(201).json({
      message: 'Successfully saved news data',
      data: {
        id: newsModel._id,
        heading: newsModel.heading,
        date: newsModel.date,
        description: newsModel.newsDescription,
        imageName: newsModel.imageName,
      },
    });
  } catch (error) {
    logger.error('Error saving news', error);
    res.status(500).json({ message: 'Server error while saving news detail', error: error.message || String(error) });
  }
});

/**
 * @desc Get all news details
 * @route GET /news/all
 */
router.get('/all', async (req, res) => {
  try {
    const allNews = await NewsModel.find().sort({ date: -1 });

    const formattedNews = allNews.map(news => ({
      id: news._id,
      heading: news.heading,
      date: news.date,
      description: news.newsDescription,
      imageName: news.imageName,
    }));

    logger.info(`News fetched: ${formattedNews.length} record(s)`);
    res.status(200).json(formattedNews);
  } catch (error) {
    logger.error('Error fetching news', error);
    res.status(500).json({ message: 'Failed to fetch news details', error: error.message || String(error) });
  }
});

/**
 * @desc Delete news detail by ID and remove image from Cloudinary
 * @route DELETE /news/delete/:id
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    const news = await NewsModel.findByIdAndDelete(req.params.id);

    if (!news) return res.status(404).json({ message: 'News not found' });

    const publicId = news.imageName.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`sahas_news/${publicId}`);
    logger.info(`News deleted: ${req.params.id}`);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    logger.error('Error deleting news', error);
    res.status(500).json({ message: 'Failed to delete', error: error.message || String(error) });
  }
});

export default router;
