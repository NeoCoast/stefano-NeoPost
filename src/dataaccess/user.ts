import type { User, Prisma } from '@prisma/client';

import prisma from '@/db/prisma';

export const findByEmail = (email: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { email } });
};

export const findByUsername = (username: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { username } });
};

export const create = async (data: Prisma.UserCreateInput): Promise<Omit<User, 'password'>> => {
  const { password: _, ...user } = await prisma.user.create({ data });
  return user;
};

export const findById = (id: bigint): Promise<User | null> => {
  return prisma.user.findUnique({ where: { id } });
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
