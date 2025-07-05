import { Router } from 'express';
import multer from 'multer';
import Message from '../Model/MessageModel.js';
import { createCloudinaryStorage } from '../utils/Cloudniarystorage.js';
import cloudinary from '../utils/cloudinary.js';

const router = Router();
const upload = multer({ storage: createCloudinaryStorage('sahas_messages') });

/**
 * Save new message (only one per position)
 */
router.post('/save', upload.single('image'), async (req, res) => {
  try {
    const { name, contact, email, message, position } = req.body;

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
      imageName: req.file.path,            // Cloudinary secure URL
      publicId: req.file.filename || req.file.public_id, // Cloudinary public ID
    });

    await newMessage.save();
    res.status(201).json({ message: 'Saved successfully', data: newMessage });
  } catch (error) {
    console.error('Save message error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

/**
 * Get all messages
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
 * Delete message by ID (also delete Cloudinary image)
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.publicId) {
      await cloudinary.uploader.destroy(message.publicId);
    }

    await Message.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Delete failed', error });
  }
});

export default router;
