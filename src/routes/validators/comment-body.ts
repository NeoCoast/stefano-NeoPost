export const createCommentSchema = {
  type: 'object',
  properties: {
    content: {
      type: 'string',
      minLength: 1,
      maxLength: 280,
    },
  },
  required: ['content'],
  additionalProperties: false,
} as const;
