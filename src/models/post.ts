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

  // Create a comment (post with parentId, no title)
  static async createComment(data: {
    content: string;
    userId: bigint;
    parentId: bigint;
  }): Promise<Post> {
    return prisma.post.create({
      data: {
        content: data.content,
        userId: data.userId,
        parentId: data.parentId,
        title: null, // Comments have no title
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  // Find direct comments for a post (excluding deleted)
  static async findCommentsByParentId(
    parentId: bigint,
    options: { page: number; limit: number }
  ): Promise<Post[]> {
    return prisma.post.findMany({
      where: {
        parentId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  // Count direct comments for a post
  static async countCommentsByParentId(parentId: bigint): Promise<number> {
    return prisma.post.count({
      where: {
        parentId,
        deletedAt: null,
      },
    });
  }

  static findByUserId(
    userId: bigint,
    options: { page: number; limit: number },
    type: 'post' | 'comment',
  ) {
    return prisma.post.findMany({
      where: {
        userId,
        parentId: type === 'post' ? null : { not: null },
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      include:
        type === 'comment'
          ? {
              parent: {
                select: {
                  id: true,
                  title: true,
                },
              },
            }
          : undefined,
    });
  }

  static countByUserId(userId: bigint, type: 'post' | 'comment'): Promise<number> {
    return prisma.post.count({
      where: {
        userId,
        parentId: type === 'post' ? null : { not: null },
        deletedAt: null,
      },
    });
  }

  static async countLikesByPostId(postId: bigint): Promise<number> {
    return prisma.like.count({
      where: { postId },
    });
  }
}

export default PostModel;