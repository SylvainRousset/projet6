const express = require('express');
const router = express.Router();
const Book = require('../models/book');
const auth = require('../middleware/auth');
const fs = require('fs');
const { upload, processImage } = require('../middleware/multer-config');

// Route GET pour récupérer les 3 livres ayant la meilleure note moyenne
router.get('/bestrating', (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 }) // Trier par averageRating décroissant
    .limit(3) // Limiter à 3 livres
    .then(books => {
      if (books.length === 0) {
        return res.status(404).json(new Error('Aucun livre trouvé'));
      }
      res.status(200).json(books);
    })
    .catch(error => next(error)); // Propager les erreurs avec next()
});

// Route GET pour récupérer tous les livres
router.get('/', (req, res) => {
  Book.find()
    .then(books => {
      res.status(200).json(books);
    })
    .catch(error => res.status(400).json(new Error(error.message)));
});

// Route GET pour récupérer un livre par ID
router.get('/:id', (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (!book) {
        return res.status(404).json(new Error('Livre non trouvé'));
      }
      res.status(200).json(book);
    })
    .catch(error => res.status(500).json(new Error(error.message)));
});

// Route POST pour ajouter un nouveau livre
router.post('/', auth, upload.single('image'), processImage, (req, res) => {

  // Vérifier si l'image est présente
  if (!req.file) {
    return res.status(400).json(new Error('Image manquante'));
  }

  // Initialiser `bookObject` à partir du body de la requête
  let bookObject = {};
  try {
    bookObject = JSON.parse(req.body.book);  // Vous devez initialiser `bookObject` avant d'accéder à ses propriétés
  } catch (error) {
    return res.status(400).json(new Error('Données de livre invalides'));
  }

  // Maintenant que `bookObject` est initialisé, vous pouvez extraire les valeurs
  const { userId, title, author, year, genre, ratings } = bookObject;

  // Vérifier que tous les champs obligatoires sont remplis
  if (!userId || !title || !author || !year || !genre || !ratings || ratings.length === 0) {
    return res.status(400).json(new Error('Tous les champs sont requis : userId, title, author, year, genre, et ratings.'));
  }

  // Vérifier que l'année est un chiffre valide
  if (isNaN(year) || year <= 0) {
    return res.status(400).json(new Error('L\'année doit être un chiffre positif'));
  }

  // Vérifier que la note est présente et valide
  const rating = ratings[0].grade;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json(new Error('Note invalide, doit être entre 1 et 5'));
  }

  // Créer une nouvelle instance du modèle `Book`
  const book = new Book({
    userId,
    title,
    author,
    year,
    genre,
    ratings,
    averageRating: rating,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  // Enregistrer le livre dans la base de données
  book.save()
    .then(() => res.status(201).json({ message: 'Livre enregistré avec succès' }))
    .catch(error => res.status(400).json(new Error(error.message)));
});



// Route PUT pour mettre à jour un livre
router.put('/:id', auth, upload.single('image'), processImage, (req, res) => {
  const bookId = req.params.id;
  const hasNewImage = req.file != null;
  let bookObject = {};

  if (hasNewImage) {
    try {
      bookObject = JSON.parse(req.body.book);
    } catch (error) {
      return res.status(400).json(new Error('Données du livre invalides'));
    }
    bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
  } else {
    bookObject = req.body;
  }

  delete bookObject.userId;
  delete bookObject.ratings;
  delete bookObject.averageRating;

  Book.findOne({ _id: bookId })
    .then((book) => {
      if (!book) {
        return res.status(404).json(new Error('Livre non trouvé'));
      }

      if (book.userId !== req.auth.userId) {
        return res.status(403).json(new Error('Requête non autorisée'));
      }

      if (hasNewImage) {
        const oldFilename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${oldFilename}`, (err) => {
          if (err) {
            console.error('Erreur lors de la suppression de l\'ancienne image :', err);
          }
        });
      }

      Book.updateOne({ _id: bookId }, { ...bookObject, _id: bookId })
        .then(() => res.status(200).json({ message: 'Livre mis à jour avec succès' }))
        .catch((error) => res.status(400).json(new Error(error.message)));
    })
    .catch((error) => res.status(500).json(new Error(error.message)));
});

// Route DELETE pour supprimer un livre
router.delete('/:id', auth, (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (!book) {
        return res.status(404).json(new Error('Livre non trouvé'));
      }
      const filename = book.imageUrl.split('/images/')[1];
      const filePath = `images/${filename}`;

      fs.unlink(filePath, (err) => {
        if (err) {
          return res.status(500).json(new Error(err.message));
        }
        Book.deleteOne({ _id: req.params.id })
          .then(() => {
            res.status(200).json({ message: 'Livre et image supprimés avec succès' });
          })
          .catch(error => res.status(400).json(new Error(error.message)));
      });
    })
    .catch(error => {
      res.status(500).json(new Error(error.message));
    });
});

router.post('/:id/rating', auth, (req, res) => {
  const { userId, rating } = req.body;

  // Trouver le livre à noter
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (!book) {
        return res.status(404).json(new Error('Livre non trouvé'));
      }

      
      const hasAlreadyRated = book.ratings.some(r => r.userId === userId);
      if (hasAlreadyRated) {
        return res.status(400).json(new Error('Vous avez déjà noté ce livre'));
      }

      
      book.ratings.push({ userId, grade: rating });

      let total = 0;
      for (let i = 0; i < book.ratings.length; i++) {
        total += book.ratings[i].grade;
      }
      book.averageRating = total / book.ratings.length;

      book.save()
        .then(updatedBook => res.status(200).json(updatedBook))
        .catch(error => res.status(400).json(new Error(error.message)));
    })
    .catch(error => res.status(500).json(new Error(error.message)));
});

module.exports = router; // Assurez-vous que vous exportez `router`
