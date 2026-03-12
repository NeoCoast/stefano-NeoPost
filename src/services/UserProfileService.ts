import { RESULT_CODES } from '@/utils/constants';
import UserModel from '@/models/UserModel';
import FollowService from '@/services/FollowService';
import type { ServiceResult } from '@/types/common';

interface UserProfile {
  id: bigint;
  email: string;
  username: string;
  birthday: Date | null;
  confirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
  followerCount: number;
  followingCount: number;
}

class UserProfileService {
  private followService: FollowService;

  constructor() {
    this.followService = new FollowService();
  }

  async getProfile(userId: bigint): Promise<ServiceResult<UserProfile>> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      const [followerCount, followingCount] = await Promise.all([
        this.followService.getFollowerCount(userId),
        this.followService.getFollowingCount(userId),
      ]);

      const { password: _password, ...userData } = user;

      return {
        code: RESULT_CODES.SUCCESS,
        data: {
          ...userData,
          followerCount,
          followingCount,
        },
      };
    } catch (error) {
      console.error('Get profile error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }
}

export default UserProfileService;
