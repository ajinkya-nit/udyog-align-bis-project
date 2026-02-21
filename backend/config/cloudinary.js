const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const hasValidCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

let storage;

if (hasValidCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'udyog-align-uploads',
      allowed_formats: ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg'],
      resource_type: 'auto'
    },
  });
} else {
  // Fallback to memory storage for hackathon dummy mode so it doesn't crash
  storage = multer.memoryStorage();
  console.log('⚠️ Running Cloudinary in Mock Mode (Dummy API keys detected)');
}

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
