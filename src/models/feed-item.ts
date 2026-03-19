import type { FeedItem } from '@prisma/client';

import prisma from '@/db/prisma';

class FeedItemModel {
  static async findByUserId(
    userId: bigint,
    options: { page: number; limit: number },
  ): Promise<FeedItem[]> {
    return prisma.feedItem.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      include: {
        post: {
          include: {
            user: {
              select: { id: true, username: true },
            },
            _count: {
              select: { likes: true, comments: true },
            },
          },
        },
      },
    });
  }

  static async countByUserId(userId: bigint): Promise<number> {
    return prisma.feedItem.count({ where: { userId } });
  }

  static async clear(userId: bigint): Promise<void> {
    await prisma.feedItem.deleteMany({ where: { userId } });
  }

  static async bulkCreate(
    items: { userId: bigint; postId: bigint; position: number }[],
  ): Promise<void> {
    await prisma.feedItem.createMany({ data: items });
  }
}

export default FeedItemModel;
