const express = require('express');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const userRoutes = require('./routes/user');
const bookRoutes = require('./routes/books');

dotenv.config();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

// Connexion à MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch((error) => console.error('Connexion à MongoDB échouée !', error));



app.use('/api/auth', userRoutes);
app.use('/api/books', bookRoutes);

module.exports = app;
