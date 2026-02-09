const bcrypt = require('bcrypt');
const { RESULT_CODES } = require('../utils/constants');
const userDataAccess = require('../dataaccess/user');

const signup = async (data) => {
  try {
    const existingEmail = await userDataAccess.findByEmail(data.email);
    if (existingEmail) {
      return { code: RESULT_CODES.ALREADY_EXISTS, data: null };
    }

    const existingUsername = await userDataAccess.findByUsername(data.username);
    if (existingUsername) {
      return { code: RESULT_CODES.ALREADY_EXISTS, data: null };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await userDataAccess.create({ ...data, password: hashedPassword });
    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;

    return { code: RESULT_CODES.SUCCESS, data: userWithoutPassword };
  } catch (error) {
    console.error('Error creating user:', error.message);
    return { code: RESULT_CODES.ERROR, data: null };
  }
};

module.exports = { signup };
