import { Enum, isEnumType } from '../utils/enumType';

export const ScanStatus = ['pending', 'running', 'completed', 'failed'] as const;

export type ScanStatus = Enum<typeof ScanStatus>;
export const isScanStatus = isEnumType(ScanStatus);
