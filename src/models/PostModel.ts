import type { Post, Prisma } from '@prisma/client';

import prisma from '@/db/prisma';

class PostModel {
  static create(data: Prisma.PostUncheckedCreateInput): Promise<Post> {
    return prisma.post.create({ data });
  }

  static findById(id: bigint): Promise<Post | null> {
    return prisma.post.findFirst({
      where: { id, deletedAt: null },
    });
  }

  static findByIdIncludingDeleted(id: bigint): Promise<Post | null> {
    return prisma.post.findUnique({ where: { id } });
  }

  static update(id: bigint, data: Prisma.PostUpdateInput): Promise<Post> {
    return prisma.post.update({ where: { id }, data });
  }

  static async softDelete(id: bigint): Promise<void> {
    await prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export default PostModel;
