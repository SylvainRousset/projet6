const multer = require('multer');
const path = require('path');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const folderPath = path.join(__dirname, '../images');
   

    callback(null, folderPath); 
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    const fileName = name + Date.now() + '.' + extension;


    callback(null, fileName); //  nom unique 
  }
});


const upload = multer({ storage: storage }).single('imageUrl');


const multerMiddleware = (req, res, next) => {
  upload(req, res, function (err) {
    if (err) {
      // Renvoyer l'erreur telle qu'elle est, sans modification
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};


module.exports = multerMiddleware;
