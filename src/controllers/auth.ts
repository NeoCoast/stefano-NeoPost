import type { Request, Response, NextFunction } from 'express';

import { RESULT_CODES } from '@/utils/constants';
import AuthService from '@/services/auth';
import JwtService from '@/services/jwt';
import passport from '@/middlewares/passport';
import type { SignupInput } from '@/types/auth';

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.signup(req.body as SignupInput);

    switch (result.code) {
      case RESULT_CODES.ALREADY_EXISTS:
        res.status(409).json({ message: 'Email or username already exists' });

        return;
      case RESULT_CODES.ERROR:
        res.status(500).json({ message: 'Error creating user', error: result.data });

        return;
      default:
        break;
    }

    res.status(201).json(result.data);
  };

  confirm = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query;

    if (!token) {
      res.status(400).json({ message: 'Token is required' });

      return;
    }

    const result = await this.authService.confirmEmail(token as string);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'User not found' });

        return;
      case RESULT_CODES.ERROR:
        res.status(400).json(result.data);

        return;
      default:
        break;
    }

    res.json(result.data);
  };

  signin = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate(
      'local',
      { session: false },
      (err: Error | null, user: Express.User | false) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.confirmed) {
          return res.status(403).json({ message: 'Please confirm your email before signing in' });
        }

        const token = JwtService.generateAuthToken(Number(user.id));
        const { password: _, ...userData } = user;

        return res.json({ token, user: userData });
      },
    )(req, res, next);
  };

  resendConfirmation = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body as { email: string };

    const result = await this.authService.resendConfirmation(email);

    if (result.code === RESULT_CODES.ERROR) {
      res.status(500).json({ message: 'Error sending confirmation email' });

      return;
    }

    res.json(result.data);
  };
}

export default AuthController;
