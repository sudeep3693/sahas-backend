import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

export const createCloudinaryStorage = (folderName, resourceType = 'image') => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: folderName,
      allowed_formats: resourceType === 'raw' ? ['pdf'] : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
      resource_type: resourceType,
    },
  });
};
