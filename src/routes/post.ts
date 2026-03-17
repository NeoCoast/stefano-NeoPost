import { Router } from 'express';

import PostController from '@/controllers/post';
import PostService from '@/services/post';
import passport from '@/middlewares/passport';
import { validateInput } from '@/middlewares/validate-input';
import { createPostSchema, editPostSchema } from '@/routes/validators/post-body';
import { createCommentSchema } from '@/routes/validators/comment-body';

const router = Router();
const authenticate = passport.authenticate('jwt', { session: false });

const postService = new PostService();
const controller = new PostController(postService);

router.post('/', authenticate, validateInput(createPostSchema), controller.create);
router.patch('/:id', authenticate, validateInput(editPostSchema), controller.edit);
router.delete('/:id', authenticate, controller.delete);

// Comment routes
router.post('/:id/comments', authenticate, validateInput(createCommentSchema), controller.createComment);
router.get('/:id/comments', authenticate, controller.getComments);

export default router;
