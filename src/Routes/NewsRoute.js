import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import NewsModel from '../Model/NewsModel.js';

const router = Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/news'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

/**
 * @desc Save new news detail with image
 * @route POST /news/save
 */
router.post('/save', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    const newsModel = new NewsModel({
      imageName: req.file.filename,
      date: req.body.date,
      heading: req.body.heading,
      newsDescription: req.body.detail,
    });

    await newsModel.save();

    res.status(201).json({
      message: 'Successfully saved news data',
      data: {
        id: newsModel._id,
        heading: newsModel.heading,
        date: newsModel.date,
        description: newsModel.newsDescription,
        imageName: newsModel.imageName
      }
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
    const allNews = await NewsModel.find();

    const formattedNews = allNews.map(news => ({
      id: news._id,
      heading: news.heading,
      date: news.date,
      description: news.newsDescription,
      imageName: news.imageName
    }));

    res.status(200).json(formattedNews);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch news details', error });
  }
});

/**
 * @desc Delete news detail by ID and remove image
 * @route DELETE /news/delete/:id
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    const news = await NewsModel.findByIdAndDelete(req.params.id);

    if (!news) return res.status(404).json({ message: 'News not found' });

    const filePath = path.join(path.resolve(), 'uploads/news', news.imageName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting news detail:', error);
    res.status(500).json({ message: 'Failed to delete' });
  }
});

export default router;
