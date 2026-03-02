import type { Post, Prisma } from '@prisma/client';
import prisma from '../db/prisma';

export const create = async (data: Prisma.PostUncheckedCreateInput): Promise<Post> => {
  const post = await prisma.post.create({ data });
  return post;
};

export const findById = async (id: bigint): Promise<Post | null> => {
  const post = await prisma.post.findUnique({ where: { id } });
  return post;
};

export const update = async (id: bigint, data: Prisma.PostUpdateInput): Promise<Post> => {
  const post = await prisma.post.update({ where: { id }, data });
  return post;
};
