const { RESULT_CODES } = require('../utils/constants');
const itemsDataAccess = require('../dataaccess/item');

const getAll = async () => {
  try {
    const items = await itemsDataAccess.getAll();
    return { code: RESULT_CODES.SUCCESS, data: items };
  } catch (error) {
    console.error('Error getting items:', error.message);
    return { code: RESULT_CODES.ERROR, data: null };
  }
};

const getById = async (id) => {
  try {
    const item = await itemsDataAccess.getById(id);

    if (!item) {
      return { code: RESULT_CODES.NOT_FOUND, data: null };
    }

    return { code: RESULT_CODES.SUCCESS, data: item };
  } catch (error) {
    console.error('Error getting item:', error.message);
    return { code: RESULT_CODES.ERROR, data: null };
  }
};

const create = async (data) => {
  try {
    const item = await itemsDataAccess.create(data);
    return { code: RESULT_CODES.SUCCESS, data: item };
  } catch (error) {
    console.error('Error creating item:', error.message);
    return { code: RESULT_CODES.ERROR, data: null };
  }
};

module.exports = { getAll, getById, create };
