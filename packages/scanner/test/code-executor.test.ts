import { describe, it, expect } from 'vitest';
import { analyzeBlockForExecution, executeCodeBlocks } from '../src/repo/code-executor.js';
import type { CodeBlock } from '../src/types.js';

function makeBlock(overrides: Partial<CodeBlock> = {}): CodeBlock {
  return {
    source: '/test/doc.md',
    language: 'js',
    code: 'const x = 1;',
    lineStart: 1,
    lineEnd: 1,
    ...overrides,
  };
}

describe('analyzeBlockForExecution', () => {
  it('marks self-contained block as executable', () => {
    const block = makeBlock({ code: 'const x = 1 + 2;\nconsole.log(x);' });
    const result = analyzeBlockForExecution(block);
    expect(result.shouldExecute).toBe(true);
  });

  it('skips blocks with imports', () => {
    const block = makeBlock({ code: 'import fs from "fs";\nfs.readFileSync("x");' });
    const result = analyzeBlockForExecution(block);
    expect(result.shouldExecute).toBe(false);
    expect(result.skipReason).toBe('has imports');
  });

  it('skips blocks with require', () => {
    const block = makeBlock({ code: 'const fs = require("fs");' });
    const result = analyzeBlockForExecution(block);
    expect(result.shouldExecute).toBe(false);
    expect(result.skipReason).toBe('has imports');
  });

  it('skips blocks with @zivodoc-skip annotation', () => {
    const block = makeBlock({ code: '// @zivodoc-skip\nconst x = brokenFunc();' });
    const result = analyzeBlockForExecution(block);
    expect(result.shouldExecute).toBe(false);
    expect(result.skipReason).toBe('author opted out');
  });

  it('skips code fragments starting with }', () => {
    const block = makeBlock({ code: '}\nconsole.log("done");' });
    const result = analyzeBlockForExecution(block);
    expect(result.shouldExecute).toBe(false);
    expect(result.skipReason).toBe('code fragment');
  });

  it('skips code fragments starting with .then(', () => {
    const block = makeBlock({ code: '.then(data => console.log(data))' });
    const result = analyzeBlockForExecution(block);
    expect(result.shouldExecute).toBe(false);
    expect(result.skipReason).toBe('code fragment');
  });

  it('skips blocks with undeclared identifiers', () => {
    const block = makeBlock({ code: 'const result = getUser(userId);' });
    const result = analyzeBlockForExecution(block);
    expect(result.shouldExecute).toBe(false);
    expect(result.skipReason).toContain('undeclared');
  });

  it('does not skip blocks using common globals', () => {
    const block = makeBlock({ code: 'const now = Date.now();\nconsole.log(now);' });
    const result = analyzeBlockForExecution(block);
    expect(result.shouldExecute).toBe(true);
  });

  it('skips JSX blocks', () => {
    const block = makeBlock({ code: 'const el = <Button onClick={handler}>Click</Button>;' });
    const result = analyzeBlockForExecution(block);
    expect(result.shouldExecute).toBe(false);
    expect(result.skipReason).toBe('contains JSX');
  });
});

describe('executeCodeBlocks', () => {
  it('executes self-contained code without error', async () => {
    const block = makeBlock({ code: 'const x = 1 + 2;\nconsole.log(x);' });
    const results = await executeCodeBlocks([block]);
    const executed = results.find((r) => r.executed);
    expect(executed).toBeDefined();
    expect(executed!.error).toBeUndefined();
  }, 10000);

  it('catches TypeError at runtime', async () => {
    const block = makeBlock({ code: 'null.toString();' });
    const results = await executeCodeBlocks([block]);
    const executed = results.find((r) => r.executed);
    expect(executed).toBeDefined();
    expect(executed!.error).toBeDefined();
    expect(executed!.error!.type).toBe('TypeError');
  }, 10000);

  it('catches ReferenceError for undefined access', async () => {
    const block = makeBlock({ code: 'var x = {};\nx.y.z;' });
    const results = await executeCodeBlocks([block]);
    const executed = results.find((r) => r.executed);
    expect(executed).toBeDefined();
    expect(executed!.error).toBeDefined();
    expect(executed!.error!.type).toBe('TypeError');
  }, 10000);

  it('skips blocks with imports and marks skipReason', async () => {
    const block = makeBlock({ code: 'import x from "y";\nx();' });
    const results = await executeCodeBlocks([block]);
    expect(results[0].executed).toBe(false);
    expect(results[0].skipReason).toBe('has imports');
  });

  it('handles common globals without false positives', async () => {
    const block = makeBlock({
      code: 'const obj = JSON.parse(\'{"a":1}\');\nconst arr = Array.from([1,2,3]);\nconsole.log(obj, arr);',
    });
    const results = await executeCodeBlocks([block]);
    const executed = results.find((r) => r.executed);
    expect(executed).toBeDefined();
    expect(executed!.error).toBeUndefined();
  }, 10000);
});
