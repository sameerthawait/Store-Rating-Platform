import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface FailedAttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockoutUntil: number | null;
}

@Injectable()
export class LoginRateLimiterService {
  private readonly attempts = new Map<string, FailedAttemptRecord>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(private readonly configService: ConfigService) {
    this.maxAttempts = this.configService.get<number>('rateLimit.loginMax', 5);
    this.windowMs = this.configService.get<number>('rateLimit.windowMs', 60000);
  }

  /**
   * Checks if an email is currently locked out from login attempts.
   * Throws HTTP 429 Too Many Requests if currently locked.
   */
  checkLockout(email: string): void {
    const key = email.toLowerCase().trim();
    const record = this.attempts.get(key);

    if (!record) {
      return;
    }

    const now = Date.now();

    // Check if currently in active lockout
    if (record.lockoutUntil && record.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many failed login attempts. Account temporarily locked for ${remainingSeconds} seconds.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Reset window if expired
    if (now - record.firstAttemptAt > this.windowMs && !record.lockoutUntil) {
      this.attempts.delete(key);
    }
  }

  /**
   * Records a failed login attempt for an email and triggers lockout when max attempts reached.
   */
  recordFailedAttempt(email: string): void {
    const key = email.toLowerCase().trim();
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now - record.firstAttemptAt > this.windowMs) {
      this.attempts.set(key, {
        count: 1,
        firstAttemptAt: now,
        lockoutUntil: null,
      });
      return;
    }

    record.count += 1;

    if (record.count >= this.maxAttempts) {
      // Lock out for the duration of the window
      record.lockoutUntil = now + this.windowMs;
    }
  }

  /**
   * Resets failed login attempts upon a successful login.
   */
  resetFailedAttempts(email: string): void {
    const key = email.toLowerCase().trim();
    this.attempts.delete(key);
  }

  /**
   * Clears all tracked attempts (used for testing).
   */
  clear(): void {
    this.attempts.clear();
  }
}
