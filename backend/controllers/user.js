const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.signup = (req, res, next) => {
  const password = req.body.password;

  if (!password || password.length < 6) {
    return next(new Error('Le mot de passe doit contenir au moins 6 caractères.'));
  }

  bcrypt.hash(password, 10)
    .then(hash => {
      const user = new User({
        email: req.body.email,
        password: hash 
      });
      user.save()
        .then(() => res.status(201).json({ message: 'Utilisateur créé avec succès !' }))
        .catch(error => next(error));  
    })
    .catch(error => next(error));  
};

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        return next(new Error('Utilisateur non trouvé.')); 
      }
      bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) {
            return next(new Error('Mot de passe incorrect.'));  
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign(
              { userId: user._id },
              process.env.JWT_SECRET,
              { expiresIn: '24h' }
            )
          });
        })
        .catch(error => next(error));  
    })
    .catch(error => next(error));  
};
