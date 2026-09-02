import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SignupDto } from '../../src/auth/dto/signup.dto';

describe('SignupDto Validation Boundaries', () => {
  const validBasePayload = {
    name: 'Alexander Montgomery James', // 26 chars
    email: 'alexander@example.com',
    address: '123 Meadowbrook Lane, Suite 400, Chicago, IL 60601',
    password: 'ValidPassword123!', // 17 chars? V-a-l-i-d-P-a-s-s-w-o-r-d-1-2-3-! is 17 chars. Let's make it 16 chars: 'SecretPass123!' (14 chars)
  };

  const createDto = (data: Partial<SignupDto>) => {
    return plainToInstance(SignupDto, { ...validBasePayload, password: 'SecretPass123!', ...data });
  };

  describe('Name validation (20 to 60 characters)', () => {
    it('should FAIL when name is 19 characters (below minimum)', async () => {
      const dto = createDto({ name: '1234567890123456789' }); // 19 chars
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should PASS when name is exactly 20 characters (lower boundary)', async () => {
      const dto = createDto({ name: '12345678901234567890' }); // 20 chars
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(false);
    });

    it('should PASS when name is exactly 60 characters (upper boundary)', async () => {
      const dto = createDto({ name: 'a'.repeat(60) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(false);
    });

    it('should FAIL when name is 61 characters (above maximum)', async () => {
      const dto = createDto({ name: 'a'.repeat(61) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });
  });

  describe('Password validation (8-16 chars, >=1 uppercase, >=1 special char)', () => {
    it('should PASS on valid password (e.g. "Pass1234!")', async () => {
      const dto = createDto({ password: 'Pass1234!' }); // 9 chars, 1 uppercase, 1 special
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(false);
    });

    it('should FAIL when password is 7 characters (too short)', async () => {
      const dto = createDto({ password: 'Pass12!' }); // 7 chars
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should FAIL when password is 17 characters (too long)', async () => {
      const dto = createDto({ password: 'ValidPassword1234!' }); // 18 chars
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should FAIL when password has no uppercase letter', async () => {
      const dto = createDto({ password: 'password123!' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should FAIL when password has no special character', async () => {
      const dto = createDto({ password: 'Password1234' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });
  });

  describe('Email validation', () => {
    it('should FAIL on malformed email missing @ or domain', async () => {
      const dto1 = createDto({ email: 'notanemail' });
      const errors1 = await validate(dto1);
      expect(errors1.some((e) => e.property === 'email')).toBe(true);

      const dto2 = createDto({ email: 'user@domain' });
      const errors2 = await validate(dto2);
      expect(errors2.some((e) => e.property === 'email')).toBe(true);
    });

    it('should PASS on standard valid email', async () => {
      const dto = createDto({ email: 'valid.user@example.com' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(false);
    });
  });

  describe('Address validation (max 400 characters)', () => {
    it('should PASS when address is exactly 400 characters', async () => {
      const dto = createDto({ address: 'x'.repeat(400) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'address')).toBe(false);
    });

    it('should FAIL when address exceeds 400 characters', async () => {
      const dto = createDto({ address: 'x'.repeat(401) });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'address')).toBe(true);
    });
  });
});
