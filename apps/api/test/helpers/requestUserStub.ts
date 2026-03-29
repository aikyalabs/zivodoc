import { AuthUser } from '@src/auth/request-user.decorator';

export const createAdminStub = (
  organizationId: string,
  roleId: string | null = null,
): AuthUser => ({
  id: 'user_test_admin',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  role: 'owner',
  organizationId,
  roleId,
});

export const createMemberStub = (
  organizationId: string,
  roleId: string | null = null,
): AuthUser => ({
  id: 'user_test_member',
  firstName: 'Member',
  lastName: 'User',
  email: 'member@example.com',
  role: 'member',
  organizationId,
  roleId,
});
