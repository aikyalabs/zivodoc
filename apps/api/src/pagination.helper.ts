const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;
const MIN_OFFSET = 0;

export function clampPagination(
  rawLimit?: string,
  rawOffset?: string,
): { limit: number; offset: number } {
  let limit = rawLimit ? parseInt(rawLimit, 10) : DEFAULT_LIMIT;
  let offset = rawOffset ? parseInt(rawOffset, 10) : MIN_OFFSET;

  if (isNaN(limit) || limit < MIN_LIMIT) limit = MIN_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  if (isNaN(offset) || offset < MIN_OFFSET) offset = MIN_OFFSET;

  return { limit, offset };
}
