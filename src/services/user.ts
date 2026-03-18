import { RESULT_CODES } from '@/utils/constants';
import UserModel from '@/models/user';
import PostModel from '@/models/post';
import FollowService from '@/services/follow';
import type { ServiceResult } from '@/types/common';
import type { Post } from '@prisma/client';

interface CommentWithParent extends Post {
  parent: { id: bigint; title: string | null } | null;
}

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
  postsCount: number;
  commentsCount: number;
}

class UserService {
  constructor(private readonly followService: FollowService) {}

  async getProfile(userId: bigint): Promise<ServiceResult<UserProfile>> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      const [followerCount, followingCount, postsCount, commentsCount] = await Promise.all([
        this.followService.getFollowerCount(userId),
        this.followService.getFollowingCount(userId),
        PostModel.countByUserId(userId, 'post'),
        PostModel.countByUserId(userId, 'comment'),
      ]);

      const { password: _password, ...userData } = user;

      return {
        code: RESULT_CODES.SUCCESS,
        data: {
          ...userData,
          followerCount,
          followingCount,
          postsCount,
          commentsCount,
        },
      };
    } catch (error) {
      console.error('Get profile error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async getUserPosts(
    userId: bigint,
    options: { page: number; limit: number },
  ): Promise<ServiceResult<{ data: object[]; pagination: object }>> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      const [posts, total] = await Promise.all([
        PostModel.findByUserId(userId, options, 'post'),
        PostModel.countByUserId(userId, 'post'),
      ]);

      const postsWithCommentsCount = await Promise.all(
        posts.map(async ({ id, title, content, createdAt }) => {
          const commentsCount = await PostModel.countCommentsByParentId(id);

          return { id, title, content, createdAt, commentsCount };
        }),
      );

      return {
        code: RESULT_CODES.SUCCESS,
        data: {
          data: postsWithCommentsCount,
          pagination: {
            page: options.page,
            limit: options.limit,
            total,
            hasMore: options.page * options.limit < total,
          },
        },
      };
    } catch (error) {
      console.error('Get user posts error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async getUserComments(
    userId: bigint,
    options: { page: number; limit: number },
  ): Promise<ServiceResult<{ data: object[]; pagination: object }>> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      const [comments, total] = await Promise.all([
        PostModel.findByUserId(userId, options, 'comment') as Promise<CommentWithParent[]>,
        PostModel.countByUserId(userId, 'comment'),
      ]);

      const commentsWithParent = (comments as CommentWithParent[]).map(
        ({ id, content, createdAt, parent }) => ({
          id,
          content,
          createdAt,
          parentPost: parent ? { id: parent.id, title: parent.title } : null,
        }),
      );

      return {
        code: RESULT_CODES.SUCCESS,
        data: {
          data: commentsWithParent,
          pagination: {
            page: options.page,
            limit: options.limit,
            total,
            hasMore: options.page * options.limit < total,
          },
        },
      };
    } catch (error) {
      console.error('Get user comments error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async listUsers(
    options: { page: number; limit: number },
  ): Promise<ServiceResult<{ data: object[]; pagination: object }>> {
    try {
      const [users, total] = await Promise.all([
        UserModel.findAll(options),
        UserModel.countAll(),
      ]);

      return {
        code: RESULT_CODES.SUCCESS,
        data: {
          data: users,
          pagination: {
            page: options.page,
            limit: options.limit,
            total,
            totalPages: Math.ceil(total / options.limit),
          },
        },
      };
    } catch (error) {
      console.error('List users error:', error);

      return { code: RESULT_CODES.ERROR, data: error };
    }
  }
}

export default UserService;
