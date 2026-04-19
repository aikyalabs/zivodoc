import { Enum, isEnumType } from '../utils/enumType';

export const ScanMode = ['site', 'repo', 'both'] as const;

export type ScanMode = Enum<typeof ScanMode>;
export const isScanMode = isEnumType(ScanMode);
