import { Router } from 'express';

import PostController from '@/controllers/PostController';
import passport from '@/middlewares/passport';
import { validateInput } from '@/middlewares/validate-input';
import { createPostSchema, editPostSchema } from '@/routes/validators/post-body';

const router = Router();
const controller = new PostController();
const authenticate = passport.authenticate('jwt', { session: false });

router.post('/', authenticate, validateInput(createPostSchema), controller.create);
router.patch('/:id', authenticate, validateInput(editPostSchema), controller.edit);
router.delete('/:id', authenticate, controller.delete);

export default router;
