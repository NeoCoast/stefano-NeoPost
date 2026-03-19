import type { Prisma } from '@prisma/client';

export type SignupInput = Pick<Prisma.UserCreateInput, 'email' | 'username' | 'password' | 'birthday'>;

export type UpdateProfileInput = {
  email?: string;
  birthday?: string;
  currentPassword?: string;
  newPassword?: string;
};

