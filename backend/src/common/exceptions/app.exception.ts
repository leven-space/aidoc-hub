import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, type ErrorCodeType } from '../i18n/error-codes';

export interface AppExceptionBody {
  code: ErrorCodeType;
  params?: Record<string, string | number>;
}

export class AppException extends HttpException {
  constructor(
    code: ErrorCodeType,
    status: HttpStatus,
    params?: Record<string, string | number>,
  ) {
    super({ code, params } satisfies AppExceptionBody, status);
  }

  static isAppExceptionBody(value: unknown): value is AppExceptionBody {
    return (
      typeof value === 'object' &&
      value !== null &&
      'code' in value &&
      typeof (value as AppExceptionBody).code === 'string'
    );
  }
}

export { ErrorCode };
