import { Enum, isEnumType } from '../utils/enumType';

export const FindingStatus = ['open', 'resolved', 'ignored', 'auto_resolved', 'reopened'] as const;

export type FindingStatus = Enum<typeof FindingStatus>;
export const isFindingStatus = isEnumType(FindingStatus);
