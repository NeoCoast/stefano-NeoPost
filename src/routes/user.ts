import { Router } from 'express';

import UserController from '@/controllers/UserController';
import passport from '@/middlewares/passport';
import { validateInput } from '@/middlewares/validate-input';

import { signupSchema, signinSchema } from '@/routes/validators/user-body';

const router = Router();
const controller = new UserController();

router.post('/signup', validateInput(signupSchema), controller.signup);
router.get('/confirm', controller.confirm);
router.post('/signin', validateInput(signinSchema), controller.signin);
router.get('/me', passport.authenticate('jwt', { session: false }), controller.me);

export default router;