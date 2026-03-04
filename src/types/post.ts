import type { Prisma } from '@prisma/client';

export type CreatePostInput = Pick<Prisma.PostUncheckedCreateInput, 'title' | 'content'>;

export type EditPostInput = Partial<CreatePostInput>;
