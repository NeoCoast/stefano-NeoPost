import type { Request, Response } from 'express';

import UserModel from '@/models/UserModel';
import FollowService from '@/services/FollowService';

class UserProfileController {
  private followService: FollowService;

  constructor() {
    this.followService = new FollowService();
  }

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = BigInt(String(req.params.id));

    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const [followerCount, followingCount] = await Promise.all([
        this.followService.getFollowerCount(userId),
        this.followService.getFollowingCount(userId),
      ]);

      const { password: _password, ...userData } = user;

      res.json({
        ...userData,
        followerCount,
        followingCount,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Error getting user profile' });
    }
  };
}

export default UserProfileController;