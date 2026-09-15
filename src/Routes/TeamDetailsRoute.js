import { Router } from 'express';
import multer from 'multer';
import TeamDetail from '../Model/TeamDetailModel.js';

const router = Router();

// Use memory storage — no image required, just in case one is passed
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @desc Save new team detail (no image required)
 * @route POST /teamDetail/save/:type
 */
router.post('/save/:type', upload.none(), async (req, res) => {
  try {
    const teamDetail = new TeamDetail({
      name: req.body.name,
      position: req.body.position,
      category: req.params.type,
      imageName: '',  // no image
      contactNumber: req.body.contactNumber || '',
      positionOrder: req.body.positionOrder ? parseInt(req.body.positionOrder, 10) : 0,
    });

    await teamDetail.save();
    res.status(201).json({ message: 'Successfully saved team data', teamDetail });
  } catch (error) {
    console.error('Error saving team detail:', error);
    res.status(500).json({ message: 'Server error while saving team detail', error: error.message || String(error) });
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
    res.status(500).json({ message: 'Failed to fetch team details', error: error.message || String(error) });
  }
});

/**
 * @desc Get all team details by category, sorted by positionOrder
 * @route GET /teamDetail/category/:category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const teamDetails = await TeamDetail.find({ category: req.params.category }).sort({ positionOrder: 1, createdAt: 1 });
    res.status(200).json(teamDetails);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team details by category', error: error.message || String(error) });
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
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message || String(error) });
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
    res.status(500).json({ message: 'Error fetching team detail by name', error: error.message || String(error) });
  }
});

/**
 * @desc Delete team detail by ID
 * @route DELETE /teamDetail/delete/:id
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    await TeamDetail.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting team detail:', error);
    res.status(500).json({ message: 'Failed to delete', error: error.message || String(error) });
  }
});

export default router;
