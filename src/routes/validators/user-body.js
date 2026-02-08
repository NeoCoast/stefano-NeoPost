const signupSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', pattern: '^[^@]+@[^@]+\\.[^@]+$' },
    username: { type: 'string', minLength: 1 },
    birthday: { type: 'string' },
    password: { type: 'string', minLength: 6 },
  },
  required: ['email', 'username', 'password'],
  additionalProperties: false,
};

module.exports = { signupSchema };
