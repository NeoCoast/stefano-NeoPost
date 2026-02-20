const express = require('express');
const passport = require('../middlewares/passport');
const { generateAuthToken } = require('../services/jwt');

const router = express.Router();
const { RESULT_CODES } = require('../utils/constants');
const userBusiness = require('../business/user');
const { validateInput } = require('../middlewares/validate-input');
const { signupSchema, signinSchema } = require('./validators/user-body');

router.post('/signup', validateInput(signupSchema), async (req, res) => {
  const result = await userBusiness.signup(req.body);

  if (result.code === RESULT_CODES.ALREADY_EXISTS) {
    res.status(409).json({ message: 'Email or username already exists' });
    return;
  }

  if (result.code === RESULT_CODES.ERROR) {
    res.status(500).json({ message: 'Error creating user', error: result.data });
    return;
  }

  res.status(201).json(result.data);
});

router.get('/confirm', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    res.status(400).json({ message: 'Token is required' });
    return;
  }

  const result = await userBusiness.confirmEmail(token);

  if (result.code === RESULT_CODES.NOT_FOUND) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (result.code === RESULT_CODES.ERROR) {
    res.status(400).json(result.data);
    return;
  }

  res.json(result.data);
});

router.post('/signin', validateInput(signinSchema), (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.confirmed) {
      return res.status(403).json({ message: 'Please confirm your email before signing in' });
    }

    const token = generateAuthToken(user.id);
    const userData = user.toJSON();
    delete userData.password;
    return res.json({ token, user: userData });
  })(req, res, next);
});

router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.status(204).send();
});

module.exports = router;
