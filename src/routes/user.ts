import { Router } from 'express';

import UserController from '@/controllers/UserController';
import passport from '@/middlewares/passport';
import { validateInput } from '@/middlewares/validate-input';

import { signupSchema, signinSchema } from '@/routes/validators/user-body';

const router = Router();
const controller = new UserController();
const authenticate = passport.authenticate('jwt', { session: false });

router.post('/signup', validateInput(signupSchema), controller.signup);
router.get('/confirm', controller.confirm);
router.post('/signin', validateInput(signinSchema), controller.signin);
router.get('/me', authenticate, controller.me);

// Follow routes
router.post('/:id/follow', authenticate, controller.follow);
router.delete('/:id/follow', authenticate, controller.unfollow);
router.get('/:id/followers', authenticate, controller.getFollowers);
router.get('/:id/following', authenticate, controller.getFollowing);

export default router;