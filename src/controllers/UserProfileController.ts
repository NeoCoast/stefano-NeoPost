import type { Request, Response } from 'express';

import { RESULT_CODES } from '@/utils/constants';
import UserProfileService from '@/services/UserProfileService';

class UserProfileController {
  private userProfileService: UserProfileService;

  constructor() {
    this.userProfileService = new UserProfileService();
  }

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = BigInt(req.params.id as string);

    const result = await this.userProfileService.getProfile(userId);

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
    const userId = BigInt(String(req.params.id));
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await this.userProfileService.getUserPosts(userId, { page, limit });

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
    const userId = BigInt(String(req.params.id));
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await this.userProfileService.getUserComments(userId, { page, limit });

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
}

export default UserProfileController;
