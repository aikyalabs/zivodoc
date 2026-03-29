import { Enum, isEnumType } from '../utils/enumType';

export const UserRole = ['admin', 'owner', 'member'] as const;

export type UserRole = Enum<typeof UserRole>;
export const isUserRole = isEnumType(UserRole);
