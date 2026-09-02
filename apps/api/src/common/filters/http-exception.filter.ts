import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'An unexpected internal error occurred. Please try again later.';
    let error = 'Internal Server Error';

    // 1. NestJS standard HttpExceptions
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = exception.name.replace('Exception', '');
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || exception.message;
        error = resObj.error || exception.name.replace('Exception', '');
      }
    }
    // 2. Prisma Known Request Errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          statusCode = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[])?.join(', ') || 'field';
          message = `A record with this ${target} already exists.`;
          error = 'Conflict';
          break;
        }
        case 'P2025': {
          statusCode = HttpStatus.NOT_FOUND;
          message = 'The requested resource was not found.';
          error = 'Not Found';
          break;
        }
        case 'P2003': {
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Invalid reference. A related record was not found.';
          error = 'Bad Request';
          break;
        }
        default: {
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Database operation failed. Please verify your request data.';
          error = 'Database Error';
          break;
        }
      }
      this.logger.warn(`Prisma Error [${exception.code}]: ${exception.message}`);
    }
    // 3. Generic unhandled errors
    else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unknown Exception: ${JSON.stringify(exception)}`);
    }

    // Standardized Sanitized Output (No stack traces or ORM internals sent to client)
    response.status(statusCode).json({
      statusCode,
      message,
      error,
    });
  }
}
