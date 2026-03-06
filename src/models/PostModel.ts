import type { Post, Prisma } from '@prisma/client';

import prisma from '@/db/prisma';

class PostModel {
  static create(data: Prisma.PostUncheckedCreateInput): Promise<Post> {
    return prisma.post.create({ data });
  }

  static findById(id: bigint): Promise<Post | null> {
    return prisma.post.findUnique({ where: { id } });
  }

  static update(id: bigint, data: Prisma.PostUpdateInput): Promise<Post> {
    return prisma.post.update({ where: { id }, data });
  }
}

export default PostModel;
