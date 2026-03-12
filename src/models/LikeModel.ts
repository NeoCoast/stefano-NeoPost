import { Prisma } from '@prisma/client';
import type { Like, User } from '@prisma/client';

import prisma from '@/db/prisma';

type LikeWithUser = Like & {
  user: Pick<User, 'id' | 'username' | 'createdAt'>;
};

class LikeModel {
  static async create(userId: bigint, postId: bigint): Promise<Like> {
    return prisma.like.create({
      data: { userId, postId },
    });
  }

  static async delete(userId: bigint, postId: bigint): Promise<Like | null> {
    try {
      return await prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  static async exists(userId: bigint, postId: bigint): Promise<boolean> {
    const count = await prisma.like.count({
      where: { userId, postId },
    });
    return count > 0;
  }

  static async countByPost(postId: bigint): Promise<number> {
    return prisma.like.count({ where: { postId } });
  }

  static async findLikersByPost(
    postId: bigint,
    options: { page: number; limit: number },
  ): Promise<LikeWithUser[]> {
    return prisma.like.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      include: {
        user: {
          select: { id: true, username: true, createdAt: true },
        },
      },
    }) as Promise<LikeWithUser[]>;
  }
}

export default LikeModel;
