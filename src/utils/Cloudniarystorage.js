import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

export const sanitizePdfPublicId = (fileName = 'document.pdf') => {
  const normalizedName = String(fileName || 'document.pdf').trim();
  const withoutExtension = normalizedName.replace(/\.[pP][dD][fF]$/, '');
  const cleanName = withoutExtension
    .replace(/[^a-zA-Z0-9-_]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return (cleanName || 'document').toLowerCase();
};

export const createCloudinaryStorage = (folderName, resourceType = 'image') => {
  const isRaw = resourceType === 'raw';

  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: folderName,
      allowed_formats: isRaw ? ['pdf'] : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      resource_type: resourceType,
      public_id: (req, file) => {
        const fallbackName = isRaw ? 'document.pdf' : 'image';
        const requestedName = req?.body?.fileName || file?.originalname || fallbackName;
        const cleanName = sanitizePdfPublicId(requestedName);
        const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // In Cloudinary, raw assets require the extension in the public_id
        // so that Cloudinary serves the file with Content-Type: application/pdf and proper filename
        return isRaw ? `${cleanName}_${uniqueId}.pdf` : `${cleanName}_${uniqueId}`;
      },
    },
  });
};

