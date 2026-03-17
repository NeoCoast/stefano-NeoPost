import { Prisma } from '@prisma/client';

import { RESULT_CODES } from '@/utils/constants';
import PostModel from '@/models/post';
import LikeModel from '@/models/like';
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

class LikeService {
  async like(
    userId: bigint,
    postId: bigint,
  ): Promise<ServiceResult<{ message: string }>> {
    try {
      const post = await PostModel.findById(postId);

      if (!post) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      const alreadyLiked = await LikeModel.exists(userId, postId);

      if (alreadyLiked) {
        return { code: RESULT_CODES.ALREADY_EXISTS, data: null };
      }

      await LikeModel.create(userId, postId);

      return { code: RESULT_CODES.SUCCESS, data: { message: 'Post liked' } };
    } catch (error) {
      console.error('Like error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async unlike(
    userId: bigint,
    postId: bigint,
  ): Promise<ServiceResult<{ message: string }>> {
    try {
      await LikeModel.delete(userId, postId);

      return { code: RESULT_CODES.SUCCESS, data: { message: 'Post unliked' } };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }
      console.error('Unlike error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async getLikers(
    postId: bigint,
    page: number,
    limit: number,
  ): Promise<ServiceResult<PaginatedResult<{ id: bigint; username: string; createdAt: Date }>>> {
    try {
      const post = await PostModel.findById(postId);

      if (!post) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      const [likes, total] = await Promise.all([
        LikeModel.findLikersByPost(postId, { page, limit }),
        LikeModel.countByPost(postId),
      ]);

      const data = likes.map((like) => ({
        id: like.user.id,
        username: like.user.username,
        createdAt: like.user.createdAt,
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
      console.error('Get likers error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async getLikeCount(postId: bigint): Promise<number> {
    return LikeModel.countByPost(postId);
  }
}

export default LikeService;