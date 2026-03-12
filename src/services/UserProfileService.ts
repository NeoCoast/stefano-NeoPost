import { RESULT_CODES } from '@/utils/constants';
import UserModel from '@/models/UserModel';
import FollowService from '@/services/FollowService';
import PostModel from '@/models/PostModel';
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
        posts.map(async (post) => {
          const commentsCount = await PostModel.countCommentsByParentId(post.id);
          return {
            id: post.id,
            title: post.title,
            content: post.content,
            createdAt: post.createdAt,
            commentsCount,
          };
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

      const commentsWithParent = (comments as CommentWithParent[]).map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        parentPost: comment.parent
          ? {
              id: comment.parent.id,
              title: comment.parent.title,
            }
          : null,
      }));

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
}

export default UserProfileService;
