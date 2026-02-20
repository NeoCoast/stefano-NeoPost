const jwt = require('jsonwebtoken');

const generateAuthToken = (userId) => jwt.sign(
  { userId },
  process.env.JWT_SECRET,
  { audience: 'api', expiresIn: '24h' },
);

const generateConfirmationToken = (userId) => jwt.sign(
  { userId },
  process.env.JWT_SECRET,
  { audience: 'email-confirmation', expiresIn: '24h' },
);

const verifyToken = (token, audience) => jwt.verify(
  token,
  process.env.JWT_SECRET,
  { audience },
);

module.exports = { generateAuthToken, generateConfirmationToken, verifyToken };
