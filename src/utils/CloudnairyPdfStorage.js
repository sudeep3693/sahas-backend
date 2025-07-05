import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

export const createCloudinaryStoragePdf = (folderName) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folderName,
      resource_type: 'raw',     // ✅ VERY IMPORTANT for PDFs
      allowed_formats: ['pdf'],
    },
  });
};
