const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Configuration de Multer pour le stockage des fichiers
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

const processImage = (req, res, next) => {
  if (!req.file) {
    return next(); 
  }

  const originalNameWithoutExt = path.parse(req.file.originalname).name; // Récupère seulement le nom sans extension
  const imageName = `${Date.now()}-${originalNameWithoutExt.split(' ').join('-')}.webp`;
  const outputPath = path.join(__dirname, '../images', imageName);

 
  sharp(req.file.buffer)  
    .resize(206, 260) 
    .toFormat('webp') 
    .toFile(outputPath)  
    .then(() => {
      req.file.filename = imageName;
      next(); 
    })
    .catch(err => {
      console.error('Erreur lors du traitement de l\'image :', err);
      return res.status(500).json(error);
    });
};

module.exports = {
  upload,
  processImage
};
