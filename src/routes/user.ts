import { Router } from 'express';

import UserController from '@/controllers/UserController';
import UserProfileController from '@/controllers/UserProfileController';
import passport from '@/middlewares/passport';
import { validateInput } from '@/middlewares/validate-input';

import { signupSchema, signinSchema } from '@/routes/validators/user-body';

const router = Router();
const userController = new UserController();
const profileController = new UserProfileController();
const authenticate = passport.authenticate('jwt', { session: false });

router.post('/signup', validateInput(signupSchema), userController.signup);
router.get('/confirm', userController.confirm);
router.post('/signin', validateInput(signinSchema), userController.signin);
router.get('/me', authenticate, userController.me);
router.get('/:id', profileController.getProfile);

// Follow routes
router.post('/:id/follow', authenticate, userController.follow);
router.delete('/:id/follow', authenticate, userController.unfollow);
router.get('/:id/followers', authenticate, userController.getFollowers);
router.get('/:id/following', authenticate, userController.getFollowing);

export default router;
