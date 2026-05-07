import { Enum, isEnumType } from '../utils/enumType';

export const FindingCategory = [
  // Links (verified via HTTP)
  'broken_link',
  'broken_anchor',
  'redirect_chain',
  'slow_link',
  // Code (verified via parser + sandbox execution)
  'syntax_error',
  'empty_code_block',
  'missing_code_lang',
  'runtime_error',
  'type_error',
  // Security (verified via pattern + context)
  'leaked_secret',
  'insecure_link',
  'internal_url',
  // Structure (verified via AST/DOM)
  'missing_page',
  'heading_skip',
  'multiple_h1',
  'empty_section',
  'broken_image',
  'missing_alt_text',
  // Content (verified with context-awareness)
  'todo_left',
  'placeholder_text',
  'outdated_date',
  'duplicate_content',
  'stale_ref',
  // OpenAPI / API spec drift
  'missing_endpoint',
  'undocumented_endpoint',
  'wrong_http_method',
] as const;

export type FindingCategory = Enum<typeof FindingCategory>;
export const isFindingCategory = isEnumType(FindingCategory);
