const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
});

/**
 * Upload base64 image to Cloudinary
 * @param {string} base64Image - Base64 encoded image
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<string>} Cloudinary URL
 */
const uploadBase64Image = async (base64Image, folder = 'face-id-samples') => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'limit' }, // Resize to max 500x500
        { quality: 'auto' }, // Auto quality optimization
      ],
    });

    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error('Không thể upload ảnh lên Cloudinary: ' + error.message);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
const getPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
};

module.exports = {
  cloudinary,
  uploadBase64Image,
  deleteImage,
  getPublicIdFromUrl,
};
