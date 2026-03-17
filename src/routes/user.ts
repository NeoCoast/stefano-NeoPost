import { Router } from 'express';

import AuthController from '@/controllers/auth';
import UserController from '@/controllers/user';
import AuthService from '@/services/auth';
import UserService from '@/services/user';
import FollowService from '@/services/follow';
import passport from '@/middlewares/passport';
import { validateInput } from '@/middlewares/validate-input';

import { signupSchema, signinSchema } from '@/routes/validators/user-body';

const router = Router();
const authenticate = passport.authenticate('jwt', { session: false });

const authService = new AuthService();
const followService = new FollowService();
const userService = new UserService(followService);
const authController = new AuthController(authService);
const userController = new UserController(userService, followService);

// Auth routes
router.post('/signup', validateInput(signupSchema), authController.signup);
router.get('/confirm', authController.confirm);
router.post('/signin', validateInput(signinSchema), authController.signin);
router.get('/me', authenticate, userController.me);

// Profile routes (public)
router.get('/:id', userController.getProfile);
router.get('/:id/posts', userController.getPosts);
router.get('/:id/comments', userController.getComments);

// Follow routes (authenticated)
router.post('/:id/follow', authenticate, userController.follow);
router.delete('/:id/follow', authenticate, userController.unfollow);
router.get('/:id/followers', authenticate, userController.getFollowers);
router.get('/:id/following', authenticate, userController.getFollowing);

export default router;
