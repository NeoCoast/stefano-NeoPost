export const signupSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', pattern: '^[^@]+@[^@]+\\.[^@]+$' },
    username: { type: 'string', minLength: 1 },
    birthday: { type: 'string' },
    password: { type: 'string', minLength: 6 },
  },
  required: ['email', 'username', 'password'],
  additionalProperties: false,
} as const;

export const signinSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', pattern: '^[^@]+@[^@]+\\.[^@]+$' },
    password: { type: 'string', minLength: 1 },
  },
  required: ['email', 'password'],
  additionalProperties: false,
} as const;
