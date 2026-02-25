const prisma = require('../db/prisma');

const create = async (data) => {
  const post = await prisma.post.create({ data });
  return post;
};

const findById = async (id) => {
  const post = await prisma.post.findUnique({ where: { id } });
  return post;
};

const update = async (id, data) => {
  const post = await prisma.post.update({ where: { id }, data });
  return post;
};

module.exports = { create, findById, update };
