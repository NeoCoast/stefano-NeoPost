const prisma = require('../db/prisma');

const findByEmail = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  return user;
};

const findByUsername = async (username) => {
  const user = await prisma.user.findUnique({ where: { username } });
  return user;
};

const create = async (data) => {
  const user = await prisma.user.create({ data });
  return user;
};

const findById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
};

const confirmUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;

  const updated = await prisma.user.update({
    where: { id },
    data: { confirmed: true },
  });
  return updated;
};

module.exports = {
  findByEmail, findByUsername, create, findById, confirmUser,
};
