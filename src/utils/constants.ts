export const RESULT_CODES = {
  SUCCESS: 'SUCCESS',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  FORBIDDEN: 'FORBIDDEN',
  EDIT_WINDOW_EXPIRED: 'EDIT_WINDOW_EXPIRED',
  ERROR: 'ERROR',
} as const;

export type ResultCode = typeof RESULT_CODES[keyof typeof RESULT_CODES];

export const EDIT_WINDOW_MS = 60 * 60 * 1000;

export const FEED_QUEUE_NAME = 'feed';
export const RECOMPUTE_JOB_NAME = 'recompute-feed';
export const MAX_FEED_SIZE = 200;
export const FOLLOW_BONUS_WEIGHT = 0.1;
