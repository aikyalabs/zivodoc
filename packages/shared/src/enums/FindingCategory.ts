import { Enum, isEnumType } from '../utils/enumType';

export const FindingCategory = [
  'broken_link',
  'broken_anchor',
  'redirect_chain',
  'syntax_error',
  'missing_page',
  'slow_link',
  'stale_ref',
  'insecure_link',
  'leaked_secret',
  'internal_url',
  'placeholder_text',
  'empty_section',
  'empty_code_block',
  'missing_code_lang',
  'heading_skip',
  'multiple_h1',
  'broken_image',
  'todo_left',
  'outdated_date',
  'readability',
  'duplicate_content',
  'inclusive_lang',
  'duplicate_word',
  'long_sentence',
  'passive_voice',
  'missing_alt_text',
  'brand_inconsistency',
] as const;

export type FindingCategory = Enum<typeof FindingCategory>;
export const isFindingCategory = isEnumType(FindingCategory);
