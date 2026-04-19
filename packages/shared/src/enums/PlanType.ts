import { Enum, isEnumType } from '../utils/enumType';

export const PlanType = ['free', 'pro', 'team'] as const;

export type PlanType = Enum<typeof PlanType>;
export const isPlanType = isEnumType(PlanType);
