import type { Post, User } from '@prisma/client';

import { RESULT_CODES, EDIT_WINDOW_MS } from '@/utils/constants';
import PostModel from '@/models/PostModel';
import type { CreatePostInput, EditPostInput } from '@/types/post';
import type { ServiceResult } from '@/types/common';

class PostService {
  async create(
    { title, content }: CreatePostInput,
    user: User,
  ): Promise<ServiceResult<Post>> {
    try {
      const post = await PostModel.create({ title, content, userId: user.id });
      return { code: RESULT_CODES.SUCCESS, data: post };
    } catch (error) {
      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async edit(
    id: bigint,
    data: EditPostInput,
    user: User,
  ): Promise<ServiceResult<Post>> {
    try {
      const post = await PostModel.findById(id);

      if (!post) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      if (post.userId !== user.id) {
        return { code: RESULT_CODES.FORBIDDEN, data: null };
      }

      const elapsed = Date.now() - new Date(post.createdAt).getTime();
      if (elapsed >= EDIT_WINDOW_MS) {
        return { code: RESULT_CODES.EDIT_WINDOW_EXPIRED, data: null };
      }

      const updated = await PostModel.update(id, data);
      return { code: RESULT_CODES.SUCCESS, data: updated };
    } catch (error) {
      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async remove(id: bigint, user: User): Promise<ServiceResult<null>> {
    try {
      const post = await PostModel.findById(id);

      if (!post) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      if (post.userId !== user.id) {
        return { code: RESULT_CODES.FORBIDDEN, data: null };
      }

      await PostModel.softDelete(id);
      return { code: RESULT_CODES.SUCCESS, data: null };
    } catch (error) {
      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async createComment(
    parentId: bigint,
    content: string,
    user: User,
  ): Promise<ServiceResult<Post>> {
    try {
      // Verify parent post exists and is not soft-deleted
      const parent = await PostModel.findById(parentId);
      if (!parent) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      const comment = await PostModel.createComment({
        content,
        userId: user.id,
        parentId,
      });

      return { code: RESULT_CODES.SUCCESS, data: comment };
    } catch (error) {
      console.error('Create comment error:', error);
      return { code: RESULT_CODES.ERROR, data: error };
    }
  }

  async getComments(
    postId: bigint,
    options: { page: number; limit: number },
  ): Promise<ServiceResult<Post[]>> {
    try {
      // Verify post exists
      const post = await PostModel.findById(postId);
      if (!post) {
        return { code: RESULT_CODES.NOT_FOUND, data: null };
      }

      const comments = await PostModel.findCommentsByParentId(postId, options);
      return { code: RESULT_CODES.SUCCESS, data: comments };
    } catch (error) {
      console.error('Get comments error:', error);
      return { code: RESULT_CODES.ERROR, data: error };
    }
  }
}

export default PostService;
