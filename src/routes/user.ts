import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';

import { RESULT_CODES } from '@/utils/constants';
import * as userBusiness from '@/business/user';
import { generateAuthToken } from '@/services/jwt';
import passport from '@/middlewares/passport';
import { validateInput } from '@/middlewares/validate-input';
import { signupSchema, signinSchema } from '@/routes/validators/user-body';
import type { SignupInput } from '@/types/auth';

const router = Router();

router.post('/signup', validateInput(signupSchema), async (req: Request, res: Response) => {
  const result = await userBusiness.signup(req.body as SignupInput);

  if (result.code === RESULT_CODES.ALREADY_EXISTS) {
    res.status(409).json({ message: 'Email or username already exists' });
    return;
  }

  if (result.code === RESULT_CODES.ERROR) {
    res.status(500).json({ message: 'Error creating user', error: result.data });
    return;
  }

  res.status(201).json(result.data);
});

router.get('/confirm', async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) {
    res.status(400).json({ message: 'Token is required' });
    return;
  }

  const result = await userBusiness.confirmEmail(token as string);

  if (result.code === RESULT_CODES.NOT_FOUND) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (result.code === RESULT_CODES.ERROR) {
    res.status(400).json(result.data);
    return;
  }

  res.json(result.data);
});

router.post('/signin', validateInput(signinSchema), (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { session: false }, (err: Error | null, user: Express.User | false) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.confirmed) {
      return res.status(403).json({ message: 'Please confirm your email before signing in' });
    }

    const token = generateAuthToken(Number(user.id));
    const { password: _, ...userData } = user;
    return res.json({ token, user: { ...userData, id: Number(userData.id) } });
  })(req, res, next);
});

router.get('/me', passport.authenticate('jwt', { session: false }), (_req: Request, res: Response) => {
  res.status(204).send();
});

export default router;
