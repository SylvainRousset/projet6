const multer = require('multer');
const cloudinary = require('./cloudinaryConfig');
const sharp = require('sharp');

const storage = multer.memoryStorage();  // mémoire tampon
const upload = multer({ storage: storage }).single('imageUrl');

const multerMiddleware = (req, res, next) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json((error));
    }

    const buffer = req.file.buffer; //  buffer en mémoire

    try {
      const resizedBuffer = await sharp(buffer)
        .resize(206, 260)
        .toFormat('webp')
        .toBuffer();  

      // Upload  Cloudinary 
      const result = await cloudinary.uploader.upload_stream({ folder: 'books' }, (error, result) => {
        if (error) {
          return res.status(500).json((error));
        }

        req.file.path = result.secure_url;
        next(); 
      }).end(resizedBuffer); // Transmettre Cloudinary

    } catch (error) {    
      return res.status(500).json((error));
    }
  });
};

module.exports = multerMiddleware;
