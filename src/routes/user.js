const express = require('express');

const router = express.Router();
const { RESULT_CODES } = require('../utils/constants');
const userBusiness = require('../business/user');
const { validateInput } = require('../middlewares/validate-input');
const { signupSchema } = require('./validators/user-body');

router.post('/signup', validateInput(signupSchema), async (req, res) => {
  const result = await userBusiness.signup(req.body);

  if (result.code === RESULT_CODES.ALREADY_EXISTS) {
    res.status(409).json({ message: 'Email or username already exists' });
    return;
  }

  if (result.code === RESULT_CODES.ERROR) {
    res.status(500).json({ message: 'Error creating user' });
    return;
  }

  res.status(201).json(result.data);
});

module.exports = router;
