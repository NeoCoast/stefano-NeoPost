const { User } = require('../db/models');

const findByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  return user;
};

const findByUsername = async (username) => {
  const user = await User.findOne({ where: { username } });
  return user;
};

const create = async (data) => {
  const user = await User.create(data);
  return user;
};

const findById = async (id) => {
  const user = await User.findByPk(id);
  return user;
};

const confirmUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) return null;
  user.confirmed = true;
  await user.save();
  return user;
};

module.exports = {
  findByEmail, findByUsername, create, findById, confirmUser,
};
