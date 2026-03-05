import type { ResultCode } from '@/utils/constants';

export type ServiceResult<T> =
  | { code: 'SUCCESS'; data: T }
  | { code: 'ERROR'; data: unknown }
  | { code: Exclude<ResultCode, 'SUCCESS' | 'ERROR'>; data: null };
