const createItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
  },
  required: ['name'],
  additionalProperties: false,
};

module.exports = { createItemSchema };
