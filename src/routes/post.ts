import { Router } from 'express';

import PostController from '@/controllers/post';
import PostService from '@/services/post';
import LikeController from '@/controllers/like';
import LikeService from '@/services/like';
import passport from '@/middlewares/passport';
import { requireConfirmed } from '@/middlewares/require-confirmed';
import { validateInput } from '@/middlewares/validate-input';
import { createPostSchema, editPostSchema } from '@/routes/validators/post-body';
import { createCommentSchema } from '@/routes/validators/comment-body';

const router = Router();
const postService = new PostService();
const likeService = new LikeService();
const controller = new PostController(postService);
const likeController = new LikeController(likeService);
const authenticate = passport.authenticate('jwt', { session: false });

router.post('/', authenticate, requireConfirmed, validateInput(createPostSchema), controller.create);
router.patch('/:id', authenticate, requireConfirmed, validateInput(editPostSchema), controller.edit);
router.delete('/:id', authenticate, requireConfirmed, controller.delete);

// Comment routes
router.post('/:id/comments', authenticate, requireConfirmed, validateInput(createCommentSchema), controller.createComment);
router.get('/:id/comments', authenticate, requireConfirmed, controller.getComments);

// Like routes
router.post('/:id/like', authenticate, likeController.like);
router.delete('/:id/like', authenticate, likeController.unlike);
router.get('/:id/likers', authenticate, likeController.getLikers);

export default router;
