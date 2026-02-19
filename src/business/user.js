const bcrypt = require('bcrypt');
const { RESULT_CODES } = require('../utils/constants');
const userDataAccess = require('../dataaccess/user');
const { generateConfirmationToken } = require('../services/jwt');
const { sendConfirmationEmail } = require('../services/email');

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

    const token = generateConfirmationToken(user.id);
    await sendConfirmationEmail(user.email, token);

    return { code: RESULT_CODES.SUCCESS, data: { message: 'Check your email to confirm your account' } };
  } catch (error) {
    console.error('Error creating user:', error.message);
    return { code: RESULT_CODES.ERROR, data: error };
  }
};

module.exports = { signup };
