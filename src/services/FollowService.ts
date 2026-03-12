import { RESULT_CODES } from '@/utils/constants';
import UserModel from '@/models/UserModel';
import FollowModel from '@/models/FollowModel';
import type { ServiceResult } from '@/types/common';

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class FollowService {
  async follow(
    followerId: bigint,
    followingId: bigint,
  ): Promise<ServiceResult<{ message: string }>> {
    try {
      if (followerId === followingId) {
        return { code: RESULT_CODES.FORBIDDEN, data: null };
      }

      const userToFollow = await UserModel.findById(followingId);
      if (!userToFollow) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      const alreadyFollowing = await FollowModel.exists(followerId, followingId);
      if (alreadyFollowing) {
        return { code: RESULT_CODES.ALREADY_EXISTS, data: null };
      }

      await FollowModel.create(followerId, followingId);

      return { code: RESULT_CODES.SUCCESS, data: { message: 'User followed successfully' } };
    } catch (error) {
      console.error('Follow error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async unfollow(
    followerId: bigint,
    followingId: bigint,
  ): Promise<ServiceResult<{ message: string }>> {
    try {
      const deleted = await FollowModel.delete(followerId, followingId);

      if (!deleted) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      return { code: RESULT_CODES.SUCCESS, data: { message: 'User unfollowed successfully' } };
    } catch (error) {
      console.error('Unfollow error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async getFollowers(
    userId: bigint,
    page: number,
    limit: number,
  ): Promise<ServiceResult<PaginatedResult<{ id: bigint; username: string; createdAt: Date }>>> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      const [followers, total] = await Promise.all([
        FollowModel.findFollowers(userId, { page, limit }),
        FollowModel.countFollowers(userId),
      ]);

      const data = followers.map(({ follower: { id, username, createdAt } }) => ({
        id,
        username,
        createdAt,
      }));

      return {
        code: RESULT_CODES.SUCCESS,
        data: {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      console.error('Get followers error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async getFollowing(
    userId: bigint,
    page: number,
    limit: number,
  ): Promise<ServiceResult<PaginatedResult<{ id: bigint; username: string; createdAt: Date }>>> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      const [following, total] = await Promise.all([
        FollowModel.findFollowing(userId, { page, limit }),
        FollowModel.countFollowing(userId),
      ]);

      const data = following.map(({ following: { id, username, createdAt } }) => ({
        id,
        username,
        createdAt,
      }));

      return {
        code: RESULT_CODES.SUCCESS,
        data: {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      console.error('Get following error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async getFollowerCount(userId: bigint): Promise<number> {
    return FollowModel.countFollowers(userId);
  }

  async getFollowingCount(userId: bigint): Promise<number> {
    return FollowModel.countFollowing(userId);
  }
}

export default FollowService;
