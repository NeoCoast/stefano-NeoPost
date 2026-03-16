import rateLimit from 'express-rate-limit';

export const resendConfirmationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
  skip: () => process.env.NODE_ENV === 'test',
});