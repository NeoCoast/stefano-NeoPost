import type { User, Prisma } from '@prisma/client';

import prisma from '@/db/prisma';

export const findByEmail = async (email: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({ where: { email } });
  return user;
};

export const findByUsername = async (username: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({ where: { username } });
  return user;
};

export const create = async (data: Prisma.UserCreateInput): Promise<User> => {
  const user = await prisma.user.create({ data });
  return user;
};

export const findById = async (id: bigint): Promise<User | null> => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
};

export const confirmUser = async (id: bigint): Promise<User | null> => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;

  const updated = await prisma.user.update({
    where: { id },
    data: { confirmed: true },
  });
  return updated;
};
