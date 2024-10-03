const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true, 
    match: [emailRegex, 'Veuillez entrer un email valide'], 
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
  },
});

// Ajout du plugin pour gérer l'unicité des champs
userSchema.plugin(uniqueValidator, { message: 'L\'{PATH} {VALUE} est déjà utilisé.' });

module.exports = mongoose.model('User', userSchema);
