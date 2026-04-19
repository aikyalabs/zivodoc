import * as acorn from 'acorn';
import type { CodeBlock, CodeCheckResult } from '../types.js';

/** Languages that acorn can parse (JavaScript variants). */
const PARSEABLE_LANGUAGES = new Set(['js', 'javascript', 'jsx', 'mjs', 'cjs']);

/** Languages we attempt as JS (TypeScript blocks are skipped since acorn doesn't handle TS). */
const TS_LANGUAGES = new Set(['ts', 'typescript', 'tsx']);

/**
 * Validate JavaScript code blocks using acorn.
 * TypeScript blocks are skipped since acorn cannot parse TS syntax.
 */
export function validateCodeBlock(block: CodeBlock): CodeCheckResult {
  const lang = block.language?.toLowerCase() ?? null;

  // Skip non-JS/TS languages or unknown languages
  if (!lang) {
    return { block, valid: true, errors: [] };
  }

  // Skip TypeScript — acorn can't parse it
  if (TS_LANGUAGES.has(lang)) {
    return { block, valid: true, errors: [] };
  }

  // Only validate JS-like languages
  if (!PARSEABLE_LANGUAGES.has(lang)) {
    return { block, valid: true, errors: [] };
  }

  try {
    acorn.parse(block.code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
      allowSuperOutsideMethod: true,
      // JSX is not natively supported by acorn, so we just try our best
    });
    return { block, valid: true, errors: [] };
  } catch (err) {
    if (err instanceof SyntaxError) {
      const acornError = err as SyntaxError & { loc?: { line: number; column: number } };
      return {
        block,
        valid: false,
        errors: [
          {
            message: acornError.message,
            line: acornError.loc?.line ?? 0,
            column: acornError.loc?.column ?? 0,
          },
        ],
      };
    }
    return { block, valid: true, errors: [] };
  }
}

/**
 * Validate all code blocks and return results.
 */
export function validateCodeBlocks(blocks: CodeBlock[]): CodeCheckResult[] {
  return blocks.map(validateCodeBlock);
}
