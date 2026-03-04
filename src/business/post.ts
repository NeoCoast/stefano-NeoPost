import type { Post, User } from '@prisma/client';

import { RESULT_CODES, EDIT_WINDOW_MS } from '@/utils/constants';
import * as postDataAccess from '@/dataaccess/post';
import type { CreatePostInput, EditPostInput } from '@/types/post';
import type { BusinessResult } from '@/types/common';

export const create = async (
  { title, content }: CreatePostInput,
  user: User,
): Promise<BusinessResult<Post>> => {
  try {
    const post = await postDataAccess.create({ title, content, userId: user.id });
    return { code: RESULT_CODES.SUCCESS, data: post };
  } catch (error) {
    return { code: RESULT_CODES.ERROR, data: error };
  }
};

export const edit = async (
  id: bigint,
  data: EditPostInput,
  user: User,
): Promise<BusinessResult<Post>> => {
  try {
    const post = await postDataAccess.findById(id);

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

    const updated = await postDataAccess.update(id, data);
    return { code: RESULT_CODES.SUCCESS, data: updated };
  } catch (error) {
    return { code: RESULT_CODES.ERROR, data: error };
  }
};
