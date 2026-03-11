export const createPostSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
    },
    content: {
      type: 'string',
      minLength: 1,
      maxLength: 280,
    },
  },
  required: ['title', 'content'],
  additionalProperties: false,
} as const;

export const editPostSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1 },
    content: { type: 'string', minLength: 1 },
  },
  required: [] as const,
  additionalProperties: false,
  minProperties: 1,
} as const;
