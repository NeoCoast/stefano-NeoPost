import { Router } from 'express';
import type { Request, Response } from 'express';
import passport from '../middlewares/passport';
import { RESULT_CODES } from '../utils/constants';
import * as postBusiness from '../business/post';
import { validateInput } from '../middlewares/validate-input';
import { createPostSchema, editPostSchema } from './validators/post-body';
import type { CreatePostInput, EditPostInput } from '../types/post';

const router = Router();

const authenticate = passport.authenticate('jwt', { session: false });

router.post('/', authenticate, validateInput(createPostSchema), async (req: Request, res: Response) => {
  const result = await postBusiness.create(req.body as CreatePostInput, req.user!);

  if (result.code !== RESULT_CODES.SUCCESS) {
    res.status(500).json({ message: 'Error creating post' });
    return;
  }

  const post = { ...result.data, id: Number(result.data.id), userId: Number(result.data.userId) };
  res.status(201).json(post);
});

router.patch('/:id', authenticate, validateInput(editPostSchema), async (req: Request, res: Response) => {
  const id = BigInt(String(req.params.id));
  const result = await postBusiness.edit(id, req.body as EditPostInput, req.user!);

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

  if (result.code !== RESULT_CODES.SUCCESS) {
    res.status(500).json({ message: 'Error editing post' });
    return;
  }

  const post = { ...result.data, id: Number(result.data.id), userId: Number(result.data.userId) };
  res.json(post);
});

export default router;
