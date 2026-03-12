import { Router } from 'express';

import PostController from '@/controllers/post';
import PostService from '@/services/post';
import LikeController from '@/controllers/LikeController';
import passport from '@/middlewares/passport';
import { validateInput } from '@/middlewares/validate-input';
import { createPostSchema, editPostSchema } from '@/routes/validators/post-body';
import { createCommentSchema } from '@/routes/validators/comment-body';

const router = Router();
const postService = new PostService();
const controller = new PostController(postService);
const likeController = new LikeController();
const authenticate = passport.authenticate('jwt', { session: false });

router.post('/', authenticate, validateInput(createPostSchema), controller.create);
router.patch('/:id', authenticate, validateInput(editPostSchema), controller.edit);
router.delete('/:id', authenticate, controller.delete);

// Comment routes
router.post('/:id/comments', authenticate, validateInput(createCommentSchema), controller.createComment);
router.get('/:id/comments', authenticate, controller.getComments);

// Like routes
router.post('/:id/like', authenticate, likeController.like);
router.delete('/:id/like', authenticate, likeController.unlike);
router.get('/:id/likers', authenticate, likeController.getLikers);

export default router;