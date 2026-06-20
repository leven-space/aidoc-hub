import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;

      // Color status for readability
      const statusColor =
        statusCode >= 500
          ? '\x1b[31m' // red
          : statusCode >= 400
            ? '\x1b[33m' // yellow
            : statusCode >= 300
              ? '\x1b[36m' // cyan
              : '\x1b[32m'; // green
      const reset = '\x1b[0m';

      this.logger.debug(
        `${method} ${originalUrl} ${statusColor}${statusCode}${reset} ${contentLength}B - ${duration}ms - ${ip} ${userAgent}`,
      );
    });

    next();
  }
}
