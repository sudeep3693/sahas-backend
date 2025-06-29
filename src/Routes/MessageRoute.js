import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Message from '../Model/MessageModel.js';

const router = Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/messages'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

// ✅ Expecting 'image' to match <input name="image" /> in frontend
const upload = multer({ storage });

/**
 * @desc Save message (only one per category allowed)
 * @route POST /message/save
 */
router.post('/save', upload.single('image'), async (req, res) => {
  try {
    const { name, contact, email, message, position } = req.body;

    // Only one message per position (chairperson/general_manager)
    const existing = await Message.findOne({ position });
    if (existing) {
      return res.status(400).json({ message: `${position} record already exists.` });
    }

    const newMessage = new Message({
      name,
      contact,
      email,
      message,
      position,
      imageName: req.file.filename,
    });

    await newMessage.save();
    res.status(201).json({ message: 'Saved successfully', data: newMessage });
  } catch (error) {
    console.error('Save message error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

/**
 * @desc Get all messages
 * @route GET /message/all
 */
router.get('/all', async (req, res) => {
  try {
    const messages = await Message.find();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error });
  }
});

/**
 * @desc Delete message by ID
 * @route DELETE /message/delete/:id
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    const { imageName } = req.body;

    // Remove image file if exists
    const imagePath = path.join(path.resolve(), 'uploads/messages', imageName);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Message.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Delete failed', error });
  }
});

export default router;
