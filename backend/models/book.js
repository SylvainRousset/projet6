const mongoose = require('mongoose');

// Définition du schéma de livre
const bookSchema = mongoose.Schema({
  userId: { type: String, required: true }, // ID de l'utilisateur qui a créé le livre
  title: { type: String, required: true },  // Titre du livre
  author: { type: String, required: true }, // Auteur du livre
  imageUrl: { type: String, required: true }, // URL de l'image/couverture
  year: { type: Number, required: true },    // Année de publication
  genre: { type: String, required: true },   // Genre du livre
  ratings: [{
    userId: { type: String, required: true }, // ID de l'utilisateur qui a donné la note
    grade: { type: Number, required: true, min: 0, max: 5 }   // Note attribuée entre 0 et 5
  }],
  averageRating: { type: Number, required: true, default: 0 } // Note moyenne initialisée à 0
});

// Exportation du modèle
module.exports = mongoose.model('Book', bookSchema);
