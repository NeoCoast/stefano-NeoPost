import type { Follow, User } from '@prisma/client';

import prisma from '@/db/prisma';

type FollowWithUser = Follow & {
  follower: Pick<User, 'id' | 'username' | 'createdAt'>;
};

type FollowingWithUser = Follow & {
  following: Pick<User, 'id' | 'username' | 'createdAt'>;
};

class FollowModel {
  static async create(followerId: bigint, followingId: bigint): Promise<Follow> {
    return prisma.follow.create({
      data: { followerId, followingId },
    });
  }

  static async delete(followerId: bigint, followingId: bigint): Promise<Follow | null> {
    try {
      return await prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      });
    } catch {
      return null;
    }
  }

  static async exists(followerId: bigint, followingId: bigint): Promise<boolean> {
    const count = await prisma.follow.count({
      where: { followerId, followingId },
    });
    return count > 0;
  }

  static async findFollowers(
    followingId: bigint,
    options: { page: number; limit: number },
  ): Promise<FollowWithUser[]> {
    return prisma.follow.findMany({
      where: { followingId },
      orderBy: { createdAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      include: {
        follower: {
          select: { id: true, username: true, createdAt: true },
        },
      },
    }) as Promise<FollowWithUser[]>;
  }

  static async findFollowing(
    followerId: bigint,
    options: { page: number; limit: number },
  ): Promise<FollowingWithUser[]> {
    return prisma.follow.findMany({
      where: { followerId },
      orderBy: { createdAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      include: {
        following: {
          select: { id: true, username: true, createdAt: true },
        },
      },
    }) as Promise<FollowingWithUser[]>;
  }

  static async countFollowers(followingId: bigint): Promise<number> {
    return prisma.follow.count({ where: { followingId } });
  }

  static async countFollowing(followerId: bigint): Promise<number> {
    return prisma.follow.count({ where: { followerId } });
  }
}

export default FollowModel;