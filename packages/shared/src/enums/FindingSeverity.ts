import { Enum, isEnumType } from '../utils/enumType';

export const FindingSeverity = ['error', 'warning', 'info'] as const;

export type FindingSeverity = Enum<typeof FindingSeverity>;
export const isFindingSeverity = isEnumType(FindingSeverity);
