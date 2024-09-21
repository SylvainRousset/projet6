const express = require('express');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv');
const auth = require('./middleware/auth'); 
const userRoutes = require('./routes/user'); 
const path = require('path');
const upload = require('./middleware/multer-config');
dotenv.config();
const Book = require('./models/book');
const cors = require('cors');
const fs = require('fs');

app.use(cors());
app.use(cors({ origin: 'http://localhost:3000' }));

// Connexion à MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  

// Middleware JSON
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/auth', userRoutes);

// Route GET pour récupérer les livres
app.get('/api/books', (req, res, next) => {
  Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json(error));  
});
 
app.get('/api/books/:id', (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json(error));  
});

// Route protégée pour ajouter un livre
app.post('/api/books', auth, upload, (req, res) => { 
  try {
    const bookData = JSON.parse(req.body.book);
    const { userId, title, author, year, genre } = bookData;
    
    if (!userId || !title || !author || !year || !genre) {
      return res.status(400).json(error);
    }

    const book = new Book({
      userId,
      title,
      author,
      imageUrl: req.file.path, 
      year,
      genre,
      ratings: bookData.ratings || [],
      averageRating: bookData.averageRating || 0
    });

    book.save()
      .then(() => res.status(201).json(book))
      .catch(error => res.status(400).json(error));  

  } catch (error) {
    res.status(400).json(error);  
  }
});

// Route protégée pour supprimer un livre
app.delete('/api/books/:id', auth, (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      const filename = book.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json())
          .catch(error => res.status(400).json(error));  
      });
    })
    .catch(error => res.status(500).json(error));  
});


app.put('/api/books/:id', auth, upload, (req, res, next) => {
  let bookObject = {};

  if (req.file) {
    // Si une nouvelle image est fournie
    bookObject = {
      ...JSON.parse(req.body.book),
      imageUrl: req.file.path, 
    };
  } else {
    // Si aucune nouvelle image n'est fournie, les autres données sont simplement mises à jour
    bookObject = { ...req.body };
  }

  Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Livre mis à jour avec succès !' }))
    .catch(error => res.status(400).json(error));  
});


// Route protégée pour noter un livre
app.post('/api/books/:id/rating', auth, (req, res, next) => {
  const { userId, rating } = req.body;
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (book.ratings.some(r => r.userId === userId)) {
        return res.status(400).json({error: error.message});
      }
      book.ratings.push({ userId, grade: rating });
      const total = book.ratings.reduce((acc, r) => acc + r.grade, 0);
      book.averageRating = total / book.ratings.length;
      book.save()
        .then(() => res.status(200).json(book))
        .catch(error => res.status(400).json(error));  
    })
    .catch(error => res.status(404).json(error));
});


module.exports = app;
