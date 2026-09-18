import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

const sanitizePdfPublicId = (fileName = 'document.pdf') => {
  const normalizedName = String(fileName || 'document.pdf').trim();
  const withoutExtension = normalizedName.replace(/\.[pP][dD][fF]$/, '');
  const cleanName = withoutExtension
    .replace(/[^a-zA-Z0-9-_]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return (cleanName || 'document').toLowerCase();
};

export const createCloudinaryStorage = (folderName, resourceType = 'image') => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: folderName,
      allowed_formats: resourceType === 'raw' ? ['pdf'] : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
      resource_type: resourceType,
      overwrite: true,
      unique_filename: false,
      use_filename: false,
      public_id: (req, file) => {
        const requestedName = req?.body?.fileName || file?.originalname || 'document.pdf';
        return sanitizePdfPublicId(requestedName);
      },
    },
  });
};
