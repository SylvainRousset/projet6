const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

// Configuration de Multer pour le stockage en mémoire
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

const processImage = (req, res, next) => {
  if (!req.file) {
    return next(); 
  }

  const originalNameWithoutExt = path.parse(req.file.originalname).name; 
  const imageName = `${Date.now()}-${originalNameWithoutExt.split(' ').join('-')}.webp`;

  
  sharp(req.file.buffer)
    .resize(206, 260)
    .toFormat('webp')
    .toBuffer()
    .then(buffer => {
      // Stockage de l'image buffer
      req.file.processedBuffer = buffer;
      req.file.filename = imageName; 
      next(); 
    })
    .catch(err => {
      console.error('Erreur lors du traitement de l\'image :', err);
      return res.status(500).json(new Error('Erreur lors du traitement de l\'image.'));
    });
};

module.exports = {
  upload,
  processImage
};
