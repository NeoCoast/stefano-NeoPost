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
}

export default PostService;
