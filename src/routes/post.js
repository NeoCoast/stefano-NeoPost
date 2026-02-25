const express = require('express');
const passport = require('../middlewares/passport');
const { RESULT_CODES } = require('../utils/constants');
const postBusiness = require('../business/post');
const { validateInput } = require('../middlewares/validate-input');
const { createPostSchema, editPostSchema } = require('./validators/post-body');

const router = express.Router();

const authenticate = passport.authenticate('jwt', { session: false });

router.post('/', authenticate, validateInput(createPostSchema), async (req, res) => {
  const result = await postBusiness.create(req.body, req.user);

  if (result.code === RESULT_CODES.ERROR) {
    res.status(500).json({ message: 'Error creating post' });
    return;
  }

  const post = { ...result.data, id: Number(result.data.id), userId: Number(result.data.userId) };
  res.status(201).json(post);
});

router.patch('/:id', authenticate, validateInput(editPostSchema), async (req, res) => {
  const id = BigInt(req.params.id);
  const result = await postBusiness.edit(id, req.body, req.user);

  if (result.code === RESULT_CODES.NOT_FOUND) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }

  if (result.code === RESULT_CODES.FORBIDDEN) {
    res.status(403).json({ message: 'You can only edit your own posts' });
    return;
  }

  if (result.code === RESULT_CODES.EDIT_WINDOW_EXPIRED) {
    res.status(403).json({ message: 'Posts can only be edited within 1 hour of creation' });
    return;
  }

  if (result.code === RESULT_CODES.ERROR) {
    res.status(500).json({ message: 'Error editing post' });
    return;
  }

  const post = { ...result.data, id: Number(result.data.id), userId: Number(result.data.userId) };
  res.json(post);
});

module.exports = router;
