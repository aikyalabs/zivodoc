export type Enum<T extends readonly string[]> = T[number];

export const isEnumType =
  <T extends readonly string[]>(values: T) =>
  (value: unknown): value is Enum<T> =>
    typeof value === 'string' && values.includes(value);
