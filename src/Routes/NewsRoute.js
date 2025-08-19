import { Router } from 'express';
import multer from 'multer';
import { createCloudinaryStorage } from '../utils/Cloudniarystorage.js';
import NewsModel from '../Model/NewsModel.js';
import cloudinary from '../utils/cloudinary.js';

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

    res.status(201).json({
      message: 'Successfully saved news data',
      data: {
        id: newsModel._id,
        heading: newsModel.heading,
        date: newsModel.date,
        description: newsModel.newsDescription,
        imageName: newsModel.imageName,  // Full URL
      },
    });
  } catch (error) {
    console.error('Error saving news detail:', error);
    res.status(500).json({ message: 'Server error while saving news detail', error });
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

    res.status(200).json(formattedNews);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch news details', error });
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

    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting news detail:', error);
    res.status(500).json({ message: 'Failed to delete' });
  }
});

export default router;
