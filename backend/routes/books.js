const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload, processImage } = require('../middleware/multer-config');
const booksController = require('../controllers/booksController');


router.get('/bestrating', booksController.getBestRatedBooks);
router.get('/', booksController.getAllBooks);
router.get('/:id', booksController.getBookById);
router.post('/', auth, upload.single('image'), processImage, booksController.createBook);
router.put('/:id', auth, upload.single('image'), processImage, booksController.updateBook);
router.delete('/:id', auth, booksController.deleteBook);
router.post('/:id/rating', auth, booksController.addRating);

module.exports = router;
