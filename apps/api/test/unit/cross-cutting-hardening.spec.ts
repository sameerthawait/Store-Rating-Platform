import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { sanitizePayload } from '../../src/common/middleware/request-logger.middleware';

describe('Cross-Cutting Hardening - Error Sanitization & Log Scrubbing', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockArgumentsHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    };
  });

  describe('HttpExceptionFilter Zero-Leakage Sanitization', () => {
    it('should format standard HttpException into { statusCode, message, error }', () => {
      const exception = new BadRequestException('Validation failed: name is too short');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed: name is too short',
        error: 'Bad Request',
      });
    });

    it('should map Prisma P2002 unique constraint error to 409 Conflict without SQL leakage', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        {
          code: 'P2002',
          clientVersion: '5.10.0',
          meta: { target: ['email'] },
        },
      );

      filter.catch(prismaError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.CONFLICT,
        message: 'A record with this email already exists.',
        error: 'Conflict',
      });

      // Verify no raw query or engine trace in response
      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.stack).toBeUndefined();
      expect(jsonCall.clientVersion).toBeUndefined();
    });

    it('should map generic unhandled Error to 500 without leaking stack traces', () => {
      const genericError = new Error('Database connection reset by peer at /var/postgres/conn.ts:140');

      filter.catch(genericError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected internal error occurred. Please try again later.',
        error: 'Internal Server Error',
      });

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.stack).toBeUndefined();
      expect(jsonCall.message).not.toContain('/var/postgres');
    });
  });

  describe('Sensitive Payload Log Scrubbing', () => {
    it('should recursively redact passwords, tokens, and hashes in logged payloads', () => {
      const rawPayload = {
        name: 'Alexander James',
        email: 'alex@example.com',
        password: 'SuperSecretPassword123!',
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        nested: {
          user_id: '123',
          password_hash: '$argon2id$v=19$m=65536...',
        },
      };

      const sanitized = sanitizePayload(rawPayload);

      expect(sanitized.name).toBe('Alexander James');
      expect(sanitized.email).toBe('alex@example.com');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.currentPassword).toBe('[REDACTED]');
      expect(sanitized.newPassword).toBe('[REDACTED]');
      expect(sanitized.refreshToken).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.nested.password_hash).toBe('[REDACTED]');
      expect(sanitized.nested.user_id).toBe('123');
    });
  });
});
