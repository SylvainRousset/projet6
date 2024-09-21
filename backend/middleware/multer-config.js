const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'books', // Le dossier où les images seront stockées sur Cloudinary
    allowed_formats: ['jpg', 'png', 'webp'], // Formats autorisés
  },
});

const upload = multer({ storage: storage }).single('imageUrl');

const multerMiddleware = (req, res, next) => {
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

module.exports = multerMiddleware;
