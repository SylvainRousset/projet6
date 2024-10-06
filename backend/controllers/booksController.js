// controllers/booksController.js
const Book = require('../models/book');
const fs = require('fs');
const path = require('path');
// Contrôleur pour récupérer les 3 livres ayant la meilleure note moyenne
exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then(books => {
      if (books.length === 0) {
        return res.status(404).json(new Error('Aucun livre trouvé'));
      }
      res.status(200).json(books);
    })
    .catch(error => next(error));
};

// Contrôleur pour récupérer tous les livres
exports.getAllBooks = (req, res) => {
  Book.find()
    .then(books => {
      res.status(200).json(books);
    })
    .catch(error => res.status(400).json(new Error(error.message)));
};

// Contrôleur pour récupérer un livre par ID
exports.getBookById = (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (!book) {
        return res.status(404).json(new Error('Livre non trouvé'));
      }
      res.status(200).json(book);
    })
    .catch(error => res.status(500).json(new Error(error.message)));
};


// Contrôleur pour ajouter un nouveau livre
exports.createBook = (req, res) => {
  let bookObject = {};
  try {
    bookObject = JSON.parse(req.body.book);
  } catch (error) {
    return res.status(400).json(new Error('Données de livre invalides'));
  }

  const { userId, title, author, year, genre, ratings } = bookObject;

  // Validation des champs
  if (!userId || !title || !author || !year || !genre || !ratings || ratings.length === 0) {
    return res.status(400).json(new Error('Tous les champs sont requis.'));
  }

  if (isNaN(year) || year <= 0) {
    return res.status(400).json(new Error('L\'année doit être un chiffre positif.'));
  }

  const rating = ratings[0].grade;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json(new Error('Note invalide, doit être entre 1 et 5.'));
  }

  // Validation des données terminée, on traite maintenant l'image
  if (!req.file) {
    return res.status(400).json(new Error('Image manquante.'));
  }

  // Enregistrer l'image redimensionnée après validation
  const imageName = req.file.filename;
  const outputPath = path.join(__dirname, '../images', imageName);

  fs.writeFile(outputPath, req.file.processedBuffer, (err) => {
    if (err) {
      console.error('Erreur lors de la sauvegarde de l\'image :', err);
      return res.status(500).json(new Error('Erreur lors de la sauvegarde de l\'image.'));
    }

    // Créer le livre une fois que l'image est enregistrée
    const imageUrl = `${req.protocol}://${req.get('host')}/images/${imageName}`;

    const book = new Book({
      userId,
      title,
      author,
      year,
      genre,
      ratings,
      averageRating: rating,
      imageUrl: imageUrl
    });

    book.save()
      .then(() => res.status(201).json({ message: 'Livre enregistré avec succès' }))
      .catch(error => res.status(400).json(new Error(error.message)));
  });
};


// Contrôleur pour mettre à jour un livre
exports.updateBook = (req, res) => {
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
    
    const { title, author, year, genre } = bookObject;
      
    if (!title || !author || !year || !genre) {
      return res.status(400).json(new Error('Tous les champs sont requis : title, author, year, genre.'));
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
};

// Contrôleur pour supprimer un livre
exports.deleteBook = (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (!book) {
        return res.status(404).json(new Error('Livre non trouvé'));
      }

      if (book.userId !== req.auth.userId) {
        return res.status(403).json(new Error('Requête non autorisée'));
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
};

// Contrôleur pour ajouter une note à un livre
exports.addRating = (req, res) => {
  const { userId, rating } = req.body;

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
      book.averageRating = Math.round((total / book.ratings.length) * 10) / 10;

      book.save()
        .then(updatedBook => res.status(200).json(updatedBook))
        .catch(error => res.status(400).json(new Error(error.message)));
    })
    .catch(error => res.status(500).json(new Error(error.message)));
};
