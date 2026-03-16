import { Router } from 'express';

import AuthController from '@/controllers/auth';
import UserController from '@/controllers/user';
import passport from '@/middlewares/passport';
import { requireConfirmed } from '@/middlewares/require-confirmed';
import { validateInput } from '@/middlewares/validate-input';

import { signupSchema, signinSchema } from '@/routes/validators/user-body';

const router = Router();
const authController = new AuthController();
const userController = new UserController();
const authenticate = passport.authenticate('jwt', { session: false });

// Auth routes
router.post('/signup', validateInput(signupSchema), authController.signup);
router.get('/confirm', authController.confirm);
router.post('/signin', validateInput(signinSchema), authController.signin);
router.get('/me', authenticate, requireConfirmed, userController.me);

// Profile routes (public)
router.get('/:id', userController.getProfile);
router.get('/:id/posts', userController.getPosts);
router.get('/:id/comments', userController.getComments);

// Follow routes (authenticated)
router.post('/:id/follow', authenticate, requireConfirmed, userController.follow);
router.delete('/:id/follow', authenticate, requireConfirmed, userController.unfollow);
router.get('/:id/followers', authenticate, requireConfirmed, userController.getFollowers);
router.get('/:id/following', authenticate, requireConfirmed, userController.getFollowing);

export default router;
