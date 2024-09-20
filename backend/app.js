const express = require('express');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv');
const auth = require('./middleware/auth'); 
const userRoutes = require('./routes/user'); 
dotenv.config();
const Book = require('./models/book');

const cors = require('cors');
app.use(cors());
app.use(cors({
  origin: 'http://localhost:3000' 
}));

// Connexion à MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(error => console.log('Erreur de connexion à MongoDB :', error));

// Middleware JSON
app.use(express.json());

// Routes d'authentification
app.use('/api/auth', userRoutes);

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
