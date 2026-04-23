export function uniqueEmail(prefix = 'test'): string {
  return `${prefix}+${Date.now()}@toolshop-qa.dev`;
}

export function uniqueName(base = 'User'): string {
  return `${base}${Date.now()}`;
}

export function testUserPayload() {
  const ts = Date.now();

  // The public demo API does not expose a user-delete endpoint.
  // Keep generated users isolated with timestamped identities so repeated
  // runs do not collide and leftover accounts stay attributable to test runs.
  return {
    first_name: 'Test',
    last_name: `User${ts}`,
    email: `test+${ts}@toolshop-qa.dev`,
    password: 'SuperSecure@2026',
    address: {
      street: '123 QA Street',
      city: 'Vancouver',
      state: 'BC',
      country: 'CA',
      postal_code: 'V6B1A1',
    },
    phone: '6041234567',
    dob: '1990-01-01',
  };
}
