import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uploadDir = 'uploads/';
    const finalName = `${file.originalname}`;

    // Check if file exists and delete it
    const filePath = path.join(uploadDir, finalName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    cb(null, finalName);
  },
});
