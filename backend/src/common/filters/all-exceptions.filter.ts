import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../i18n/error-codes';
import { resolveLocale, translateError } from '../i18n/messages';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const locale = resolveLocale(request.headers['accept-language']);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let code: string | undefined;
    let message: string;

    if (AppException.isAppExceptionBody(rawResponse)) {
      code = rawResponse.code;
      message = translateError(rawResponse.code, locale, rawResponse.params);
    } else if (
      typeof rawResponse === 'object' &&
      rawResponse !== null &&
      Array.isArray((rawResponse as { message?: unknown }).message)
    ) {
      code = ErrorCode.VALIDATION_FAILED;
      const details = (rawResponse as { message: string[] }).message.join(', ');
      message =
        locale === 'zh-CN'
          ? `${translateError(ErrorCode.VALIDATION_FAILED, locale)}：${details}`
          : `${translateError(ErrorCode.VALIDATION_FAILED, locale)}: ${details}`;
    } else if (typeof rawResponse === 'string') {
      message = rawResponse;
    } else if (
      typeof rawResponse === 'object' &&
      rawResponse !== null &&
      typeof (rawResponse as { message?: unknown }).message === 'string'
    ) {
      message = (rawResponse as { message: string }).message;
    } else {
      code = ErrorCode.INTERNAL_ERROR;
      message = translateError(ErrorCode.INTERNAL_ERROR, locale);
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} ${status} - ${message}`,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      ...(code ? { code } : {}),
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
