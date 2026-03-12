import type { Request, Response, NextFunction } from 'express';

import { RESULT_CODES } from '@/utils/constants';
import UserService from '@/services/UserService';
import FollowService from '@/services/FollowService';
import JwtService from '@/services/JwtService';
import passport from '@/middlewares/passport';
import type { SignupInput } from '@/types/auth';

class UserController {
  private userService: UserService;
  private followService: FollowService;

  constructor() {
    this.userService = new UserService();
    this.followService = new FollowService();
  }

  signup = async (req: Request, res: Response): Promise<void> => {
    const result = await this.userService.signup(req.body as SignupInput);

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

    const result = await this.userService.confirmEmail(token as string);

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

  me = (_req: Request, res: Response): void => {
    res.status(204).send();
  };

  follow = async (req: Request, res: Response): Promise<void> => {
    const followingId = BigInt(String(req.params.id));
    const followerId = BigInt(req.user!.id);

    const result = await this.followService.follow(followerId, followingId);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'User not found' });
        return;
      case RESULT_CODES.FORBIDDEN:
        res.status(400).json({ message: 'Cannot follow yourself' });
        return;
      case RESULT_CODES.ALREADY_EXISTS:
        res.status(409).json({ message: 'Already following this user' });
        return;
      case RESULT_CODES.ERROR:
        res.status(500).json({ message: 'Error following user' });
        return;
      default:
        break;
    }

    res.status(201).json(result.data);
  };

  unfollow = async (req: Request, res: Response): Promise<void> => {
    const followingId = BigInt(String(req.params.id));
    const followerId = BigInt(req.user!.id);

    const result = await this.followService.unfollow(followerId, followingId);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'Not following this user' });
        return;
      case RESULT_CODES.ERROR:
        res.status(500).json({ message: 'Error unfollowing user' });
        return;
      default:
        break;
    }

    res.json(result.data);
  };

  getFollowers = async (req: Request, res: Response): Promise<void> => {
    const userId = BigInt(String(req.params.id));
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await this.followService.getFollowers(userId, page, limit);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'User not found' });
        return;
      case RESULT_CODES.ERROR:
        res.status(500).json({ message: 'Error getting followers' });
        return;
      default:
        break;
    }

    res.json(result.data);
  };

  getFollowing = async (req: Request, res: Response): Promise<void> => {
    const userId = BigInt(String(req.params.id));
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await this.followService.getFollowing(userId, page, limit);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'User not found' });
        return;
      case RESULT_CODES.ERROR:
        res.status(500).json({ message: 'Error getting following' });
        return;
      default:
        break;
    }

    res.json(result.data);
  };
}

export default UserController;