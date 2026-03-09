import type { Post, Prisma } from '@prisma/client';

import prisma from '@/db/prisma';

export const create = (data: Prisma.PostUncheckedCreateInput): Promise<Post> => {
  return prisma.post.create({ data });
};

export const findById = (id: bigint): Promise<Post | null> => {
  return prisma.post.findUnique({ where: { id } });
};

export const update = (id: bigint, data: Prisma.PostUpdateInput): Promise<Post> => {
  return prisma.post.update({ where: { id }, data });
};
