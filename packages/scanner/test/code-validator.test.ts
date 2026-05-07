import { describe, it, expect } from 'vitest';
import { validateCodeBlock, validateCodeBlocks } from '../src/repo/code-validator.js';
import type { CodeBlock } from '../src/types.js';

function makeBlock(overrides: Partial<CodeBlock> = {}): CodeBlock {
  return {
    source: '/test.md',
    language: 'javascript',
    code: 'const x = 1;',
    lineStart: 1,
    lineEnd: 1,
    ...overrides,
  };
}

describe('code-validator', () => {
  it('validates correct JavaScript', () => {
    const result = validateCodeBlock(makeBlock({ code: 'const x = 1;\nconst y = x + 2;' }));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects syntax errors in JavaScript', () => {
    const result = validateCodeBlock(makeBlock({ code: 'const x = { name: "test" age: 25 }' }));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('skips TypeScript blocks (acorn cannot parse TS)', () => {
    const result = validateCodeBlock(
      makeBlock({ language: 'typescript', code: 'const x: number = 1;' }),
    );
    expect(result.valid).toBe(true);
  });

  it('skips unknown languages', () => {
    const result = validateCodeBlock(makeBlock({ language: 'python', code: 'def foo(): pass' }));
    expect(result.valid).toBe(true);
  });

  it('skips blocks without language', () => {
    const result = validateCodeBlock(makeBlock({ language: null }));
    expect(result.valid).toBe(true);
  });

  it('handles async/await syntax', () => {
    const result = validateCodeBlock(makeBlock({ code: 'const data = await fetch("/api");' }));
    expect(result.valid).toBe(true);
  });

  it('handles import/export syntax', () => {
    const result = validateCodeBlock(
      makeBlock({ code: 'import { foo } from "bar";\nexport default foo;' }),
    );
    expect(result.valid).toBe(true);
  });

  it('validates multiple blocks at once', () => {
    const blocks = [
      makeBlock({ code: 'const a = 1;' }),
      makeBlock({ code: 'const b = {' }),
      makeBlock({ language: 'python', code: 'x = 1' }),
    ];
    const results = validateCodeBlocks(blocks);
    expect(results).toHaveLength(3);
    expect(results[0].valid).toBe(true);
    expect(results[1].valid).toBe(false);
    expect(results[2].valid).toBe(true);
  });
});
