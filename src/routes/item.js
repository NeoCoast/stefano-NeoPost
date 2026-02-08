const express = require('express');

const router = express.Router();
const { RESULT_CODES } = require('../utils/constants');
const itemsBusiness = require('../business/item');
const { validateInput } = require('../middlewares/validate-input');
const { createItemSchema } = require('./validators/item-body');

router.get('/', async (req, res) => {
  const result = await itemsBusiness.getAll();
  res.json(result.data);
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const result = await itemsBusiness.getById(id);

  if (result.code === RESULT_CODES.NOT_FOUND) {
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  res.json(result.data);
});

router.post('/', validateInput(createItemSchema), async (req, res) => {
  const result = await itemsBusiness.create(req.body);

  if (result.code === RESULT_CODES.ERROR) {
    res.status(500).json({ message: 'Error creating item' });
    return;
  }

  res.status(201).json(result.data);
});

module.exports = router;
