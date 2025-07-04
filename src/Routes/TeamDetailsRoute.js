import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import TeamDetail from '../Model/TeamDetailModel.js';
import { createCloudinaryStorage } from '../utils/Cloudniarystorage.js'; // your helper

const router = Router();

// Use Cloudinary storage instead of local disk
const storage = createCloudinaryStorage('teamDetails');
const upload = multer({ storage });

/**
 * @desc Save new team detail with image to Cloudinary
 * @route POST /teamDetail/save/:type
 */
router.post('/save/:type', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    // req.file.path contains the Cloudinary URL of uploaded image
    const teamDetail = new TeamDetail({
      name: req.body.name,
      position: req.body.position,
      category: req.params.type,
      imageName: req.file.path,  // Save Cloudinary URL here
    });

    await teamDetail.save();
    res.status(201).json({ message: 'Successfully saved team data', teamDetail });
  } catch (error) {
    console.error('Error saving team detail:', error);
    res.status(500).json({ message: 'Server error while saving team detail', error });
  }
});

/**
 * @desc Get all team details
 * @route GET /teamDetail/all
 */
router.get('/all', async (req, res) => {
  try {
    const teamDetails = await TeamDetail.find();
    res.status(200).json(teamDetails);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch team details', error });
  }
});

/**
 * @desc Get all team details by category
 * @route GET /teamDetail/category/:category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const teamDetails = await TeamDetail.find({ category: req.params.category });
    res.status(200).json(teamDetails);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team details by category', error });
  }
});

/**
 * @desc Get all unique categories
 * @route GET /teamDetail/categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await TeamDetail.distinct('category');
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error });
  }
});

/**
 * @desc Get team detail by name (case-insensitive)
 * @route GET /teamDetail/name/:name
 */
router.get('/name/:name', async (req, res) => {
  try {
    const teamDetail = await TeamDetail.findOne({ name: { $regex: `^${req.params.name}$`, $options: 'i' } });
    if (!teamDetail) return res.status(404).json({ message: 'Team member not found' });
    res.status(200).json(teamDetail);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team detail by name', error });
  }
});

/**
 * @desc Delete team detail by ID (Cloudinary image deletion not included here)
 * @route DELETE /teamDetail/delete/:id
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    // Note: Your current code deletes local file from disk
    // Since image is on Cloudinary, you need to delete it via Cloudinary API
    // For now, just deleting DB entry without deleting Cloudinary image

    await TeamDetail.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting team detail:', error);
    res.status(500).json({ message: 'Failed to delete' });
  }
});

export default router;
