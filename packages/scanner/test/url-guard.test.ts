import { describe, expect, it } from 'vitest';

import { isPrivateAddress, isPublicUrl } from '../src/shared/url-guard.js';

describe('isPrivateAddress', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '::1',
    'fd00::1',
    'fe80::1',
    '::ffff:127.0.0.1',
  ])('flags %s as private', (address) => expect(isPrivateAddress(address)).toBe(true));

  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])('allows %s', (address) =>
    expect(isPrivateAddress(address)).toBe(false),
  );
});

describe('isPublicUrl', () => {
  it('rejects internal and non-http targets', async () => {
    expect(await isPublicUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(await isPublicUrl('http://localhost:6379')).toBe(false);
    expect(await isPublicUrl('http://[::1]/')).toBe(false);
    expect(await isPublicUrl('file:///etc/passwd')).toBe(false);
    expect(await isPublicUrl('not a url')).toBe(false);
  });

  it('allows a public IP literal', async () => {
    expect(await isPublicUrl('https://1.1.1.1/')).toBe(true);
  });
});
