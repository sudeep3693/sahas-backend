import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

export const createCloudinaryStorage = (folderName) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: folderName,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
    },
  });
};
