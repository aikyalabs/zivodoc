import * as acorn from 'acorn';
import yaml from 'js-yaml';
import type { CodeBlock, CodeCheckResult } from '../types.js';

/** Languages that acorn can parse (JavaScript variants). */
export const PARSEABLE_LANGUAGES = new Set(['js', 'javascript', 'jsx', 'mjs', 'cjs']);

/** Languages we attempt as JS (TypeScript blocks are skipped since acorn doesn't handle TS). */
const TS_LANGUAGES = new Set(['ts', 'typescript', 'tsx']);

const JSON_LANGUAGES = new Set(['json', 'jsonc']);
const YAML_LANGUAGES = new Set(['yaml', 'yml']);

const MIN_BLOCK_CHARS = 8;

function isJsonFragment(code: string): boolean {
  const trimmed = code.trim();
  if (trimmed.length < MIN_BLOCK_CHARS) return true;
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  const balancedObject = first === '{' && last === '}';
  const balancedArray = first === '[' && last === ']';
  const isString = first === '"' && last === '"';
  return !(balancedObject || balancedArray || isString);
}

/**
 * Validate JavaScript code blocks using acorn.
 * TypeScript blocks are skipped since acorn cannot parse TS syntax.
 */
export function validateCodeBlock(block: CodeBlock): CodeCheckResult {
  const lang = block.language?.toLowerCase() ?? null;

  if (!lang) {
    return { block, valid: true, errors: [] };
  }

  if (TS_LANGUAGES.has(lang)) {
    return { block, valid: true, errors: [] };
  }

  if (JSON_LANGUAGES.has(lang)) {
    return validateJsonBlock(block);
  }

  if (YAML_LANGUAGES.has(lang)) {
    return validateYamlBlock(block);
  }

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

function validateJsonBlock(block: CodeBlock): CodeCheckResult {
  const code = block.code;
  if (isJsonFragment(code)) {
    return { block, valid: true, errors: [] };
  }
  try {
    JSON.parse(code);
    return { block, valid: true, errors: [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      block,
      valid: false,
      errors: [{ message, line: 0, column: 0 }],
    };
  }
}

function validateYamlBlock(block: CodeBlock): CodeCheckResult {
  const code = block.code.trim();
  if (code.length < MIN_BLOCK_CHARS) {
    return { block, valid: true, errors: [] };
  }
  try {
    yaml.load(block.code);
    return { block, valid: true, errors: [] };
  } catch (err) {
    if (err instanceof yaml.YAMLException) {
      return {
        block,
        valid: false,
        errors: [
          {
            message: err.reason || err.message,
            line: err.mark?.line != null ? err.mark.line + 1 : 0,
            column: err.mark?.column != null ? err.mark.column + 1 : 0,
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
