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

  static updateById(id: bigint, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }

  static async confirmUser(id: bigint): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;

    if (user.pendingEmail) {
      return prisma.user.update({
        where: { id },
        data: { email: user.pendingEmail, pendingEmail: null, confirmed: true },
      });
    }

    return prisma.user.update({
      where: { id },
      data: { confirmed: true },
    });
  }

  static findAll(options: {
    page: number;
    limit: number;
  }): Promise<{ id: bigint; username: string }[]> {
    return prisma.user.findMany({
      where: { confirmed: true },
      select: { id: true, username: true },
      orderBy: { createdAt: 'asc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    });
  }

  static countAll(): Promise<number> {
    return prisma.user.count({ where: { confirmed: true } });
  }

  static isEmailTaken(email: string, excludeId?: bigint): Promise<boolean> {
    return prisma.user.findFirst({
      where: {
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
        OR: [{ email }, { pendingEmail: email }],
      },
    }).then((user) => !!user);
  }
}

export default UserModel;
