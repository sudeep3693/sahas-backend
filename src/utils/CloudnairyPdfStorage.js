import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

export const createCloudinaryStoragePdf = (folderName) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => ({
      folder: folderName,
      resource_type: 'raw',
      allowed_formats: ['pdf'],
      public_id: file.originalname.replace(/\.[^/.]+$/, "")  // removes old extension if any
    }),
  });
};
