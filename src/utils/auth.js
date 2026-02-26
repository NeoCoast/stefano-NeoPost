const bcrypt = require('bcrypt');

const verifyPassword = async (hashedPassword, plainPassword) => (
  bcrypt.compare(plainPassword, hashedPassword)
);

module.exports = { verifyPassword };
