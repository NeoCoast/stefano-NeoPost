const createPostSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1 },
    content: { type: 'string', minLength: 1 },
  },
  required: ['title', 'content'],
  additionalProperties: false,
};

const editPostSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1 },
    content: { type: 'string', minLength: 1 },
  },
  required: [],
  additionalProperties: false,
  minProperties: 1,
};

module.exports = { createPostSchema, editPostSchema };
