const express = require('express');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv');


dotenv.config();
const Book = require('./models/book');

const cors = require('cors');
app.use(cors());
app.use(cors({
  origin: 'http://localhost:3000' // URL du frontend
}));
// Connexion à MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(error => console.log('Erreur de connexion à MongoDB :', error));

// Middleware pour traiter les requêtes JSON
app.use(express.json());


app.get('/api/books', (req, res, next) => {
  Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
});

// route GET
app.get('/api/books', (req, res, next) => {
  res.status(200).json({ message: "Liste des livres" });
});

module.exports = app;
