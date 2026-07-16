import { describe, expect, it } from 'vitest';

import { buildAdminUsername } from './buildAdminUsername';

// These cases MUST stay in lockstep with the server's buildAdminUsername
// (server/src/common/utils/buildAdminUsername.ts). If the backend rule changes,
// both this file and the server spec should change together.
describe('buildAdminUsername', () => {
  it('appends the "admin" suffix with no separator', () => {
    expect(buildAdminUsername('Acme')).toBe('Acmeadmin');
  });

  it('strips spaces and punctuation before appending the suffix', () => {
    expect(buildAdminUsername('Acme School')).toBe('AcmeSchooladmin');
    expect(buildAdminUsername('Acme Corp!')).toBe('AcmeCorpadmin');
    expect(buildAdminUsername('a.b-c_d')).toBe('abcdadmin');
  });

  it('strips non-ASCII-alphanumeric (unicode) characters', () => {
    expect(buildAdminUsername('École Supérieure')).toBe('coleSuprieureadmin');
  });

  it('falls back to just "admin" when the name has no alphanumerics', () => {
    expect(buildAdminUsername('   ')).toBe('admin');
    expect(buildAdminUsername('!!!')).toBe('admin');
    expect(buildAdminUsername('')).toBe('admin');
  });

  it('clamps the base to 15 chars so the total never exceeds 20', () => {
    const result = buildAdminUsername('a'.repeat(50));
    expect(result).toBe('aaaaaaaaaaaaaaaadmin'); // 15 a's + "admin"
    expect(result.length).toBe(20);
  });

  it('keeps digits', () => {
    expect(buildAdminUsername('PW Org 1720000000000')).toBe(
      'PWOrg1720000000admin', // "PWOrg" + digits, base clamped to 15
    );
  });
});
