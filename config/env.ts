import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export function getEnv() {
  const WEB_BASE_URL =
    process.env.WEB_BASE_URL ?? 'https://practicesoftwaretesting.com';
  const API_BASE_URL =
    process.env.API_BASE_URL ?? 'https://api.practicesoftwaretesting.com';
  const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL ?? '';
  const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? '';
  return {
    WEB_BASE_URL,
    API_BASE_URL,
    TEST_USER_EMAIL,
    TEST_USER_PASSWORD,
  } as const;
}
