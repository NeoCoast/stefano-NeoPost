import type { User, Prisma } from '@prisma/client';

import prisma from '@/db/prisma';

class UserModel {
  static findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  static findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  static create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  static findById(id: bigint): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  static async confirmUser(id: bigint): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;

    return prisma.user.update({
      where: { id },
      data: { confirmed: true },
    });
  }
}

export default UserModel;
