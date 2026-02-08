const { Item } = require('../db/models');

const getAll = async () => {
  const items = await Item.findAll();
  return items;
};

const getById = async (id) => {
  const item = await Item.findByPk(id);
  return item;
};

const create = async (data) => {
  const item = await Item.create(data);
  return item;
};

module.exports = { getAll, getById, create };
