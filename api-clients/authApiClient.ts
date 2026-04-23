import { BaseApiClient } from './baseApiClient';

export class AuthApiClient {
  constructor(private readonly api: BaseApiClient) {}

  async login(email: string, password: string): Promise<string> {
    const result = await this.api.post<{ access_token: string }>(
      '/users/login',
      { email, password },
    );
    if (!result.ok) throw new Error(`Login failed: ${result.status}`);
    return result.body.access_token;
  }

  async loginRaw(email: string, password: string): Promise<number> {
    const result = await this.api.post<{ access_token: string }>(
      '/users/login',
      { email, password },
    );
    return result.status;
  }

  async register(payload: Record<string, unknown>) {
    return this.api.post<{ id: string }>('/users/register', payload);
  }
}
