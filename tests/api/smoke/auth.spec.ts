import { test, expect } from '../../../fixtures/baseTest';
import { expectStatus } from '../../../utils/apiAssertions';
import { getEnv } from '../../../config/env';
import { testUserPayload } from '../../../utils/dataFactory';

const ENV = getEnv();

test.describe('Auth API', { tag: ['@smoke', '@regression'] }, () => {
  test('POST /users/login returns 401 for wrong password', async ({
    authApi,
  }) => {
    const status = await authApi.loginRaw('nobody@test.com', 'wrongpassword');
    expectStatus(status, 401);
  });

  test('POST /users/register creates a new user and login succeeds', async ({
    authApi,
  }) => {
    // generate unique user data
    const payload = testUserPayload();

    const registerResult = await authApi.register(payload);
    expectStatus(registerResult.status, 201);

    const token = await authApi.login(payload.email, payload.password);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
});

test.describe(
  'Auth API private smoke',
  { tag: ['@smoke', '@regression', '@auth'] },
  () => {
    test('POST /users/login returns 200 with valid credentials', async ({
      authApi,
    }) => {
      const token = await authApi.login(
        ENV.TEST_USER_EMAIL,
        ENV.TEST_USER_PASSWORD,
      );
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  },
);
