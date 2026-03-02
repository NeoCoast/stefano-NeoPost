import type { ResultCode } from '../utils/constants';

export type BusinessResult<T> =
  | { code: 'SUCCESS'; data: T }
  | { code: 'ERROR'; data: unknown }
  | { code: Exclude<ResultCode, 'SUCCESS' | 'ERROR'>; data: null };
