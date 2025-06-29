// routes/auth.js
import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/notice'),
  filename: (req, file, cb) => {
    const uploadDir = 'uploads/notice/';
    const finalName = `${Date.now()}-${file.originalname}`;

    const filePath = path.join(uploadDir, finalName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    cb(null, finalName);
  },
});


const upload = multer({ storage });

router.post('/', upload.array('images'), (req, res) => {
  try {
    const files = req.files;
    const descriptions = Array.isArray(req.body.descriptions)
      ? req.body.descriptions
      : [req.body.descriptions];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    console.log('Descriptions:', descriptions);
    console.log('Files:', files.map(f => f.filename));

    return res.status(200).json({ message: 'Images updated successfully' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed on server' });
  }
});

router.get('/', (req, res) => {
  fs.readdir('./uploads/notice', (err, files) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Failed to read directory' });
    }
    console.log("successfully fetched notice images");
    res.status(200).json(files); 
  });
});

// DELETE an image
router.delete('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('./uploads/notice', filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.status(200).json({ message: 'Image deleted' });
  } else {
    return res.status(404).json({ error: 'File not found' });
  }
});



export default router;
