import type { Request, Response } from 'express';

import { RESULT_CODES } from '@/utils/constants';
import UserService from '@/services/user';
import FollowService from '@/services/follow';

class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly followService: FollowService,
  ) {}

  me = (_req: Request, res: Response): void => {
    res.status(204).send();
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = BigInt(req.params.id as string);

    const result = await this.userService.getProfile(userId);

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'User not found' });

        return;
      case RESULT_CODES.ERROR:
        res.status(500).json({ message: 'Error getting user profile' });

        return;
      default:
        break;
    }

    res.json(result.data);
  };

  getPosts = async (req: Request, res: Response): Promise<void> => {
    const userId = BigInt(req.params.id as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await this.userService.getUserPosts(userId, { page, limit });

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'User not found' });

        return;
      case RESULT_CODES.ERROR:
        res.status(500).json({ message: 'Error getting user posts' });

        return;
      default:
        break;
    }

    res.json(result.data);
  };

  getComments = async (req: Request, res: Response): Promise<void> => {
    const userId = BigInt(req.params.id as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await this.userService.getUserComments(userId, { page, limit });

    switch (result.code) {
      case RESULT_CODES.NOT_FOUND:
        res.status(404).json({ message: 'User not found' });

        return;
      case RESULT_CODES.ERROR:
        res.status(500).json({ message: 'Error getting user comments' });

        return;
      default:
        break;
    }

    res.json(result.data);
  };

  follow = async (req: Request, res: Response): Promise<void> => {
    const followingId = BigInt(req.params.id as string);
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
    const followingId = BigInt(req.params.id as string);
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
    const userId = BigInt(req.params.id as string);
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
    const userId = BigInt(req.params.id as string);
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
