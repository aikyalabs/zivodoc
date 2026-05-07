import * as acorn from 'acorn';
import type { CodeBlock, CodeExecutionResult } from '../types.js';

const COMMON_GLOBALS = new Set([
  'console',
  'Math',
  'JSON',
  'Promise',
  'Date',
  'Array',
  'Object',
  'String',
  'Number',
  'Boolean',
  'RegExp',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Symbol',
  'Error',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'URIError',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'undefined',
  'NaN',
  'Infinity',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'queueMicrotask',
  'structuredClone',
  'atob',
  'btoa',
  'crypto',
  'globalThis',
  'self',
  'window',
  'document',
  'fetch',
  'URL',
  'URLSearchParams',
  'TextEncoder',
  'TextDecoder',
  'AbortController',
  'AbortSignal',
  'Headers',
  'Request',
  'Response',
  'ReadableStream',
  'WritableStream',
  'TransformStream',
  'Blob',
  'File',
  'FormData',
  'Event',
  'EventTarget',
  'CustomEvent',
  'performance',
  'encodeURIComponent',
  'decodeURIComponent',
  'encodeURI',
  'decodeURI',
  'Proxy',
  'Reflect',
  'BigInt',
  'AggregateError',
  'FinalizationRegistry',
  'WeakRef',
  'Intl',
  'SharedArrayBuffer',
  'Atomics',
  'DataView',
  'ArrayBuffer',
  'Float32Array',
  'Float64Array',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Uint8Array',
  'Uint16Array',
  'Uint32Array',
  'Uint8ClampedArray',
  'Iterator',
  'AsyncIterator',
]);

const SKIP_ANNOTATION = /\/\/\s*@zivodoc-skip|\/\*\s*@zivodoc-skip\s*\*\//;
const FRAGMENT_START = /^\s*[})\].]|^\s*\.then\s*\(|^\s*else\b|^\s*catch\s*\(/;
const IMPORT_PATTERN = /\bimport\s+|require\s*\(/;
const JSX_PATTERN = /<[A-Z][a-zA-Z]*[\s/>]/;

export function analyzeBlockForExecution(block: CodeBlock): {
  shouldExecute: boolean;
  skipReason?: string;
} {
  const code = block.code;

  if (SKIP_ANNOTATION.test(code)) return { shouldExecute: false, skipReason: 'author opted out' };
  if (FRAGMENT_START.test(code)) return { shouldExecute: false, skipReason: 'code fragment' };
  if (IMPORT_PATTERN.test(code)) return { shouldExecute: false, skipReason: 'has imports' };
  if (JSX_PATTERN.test(code)) return { shouldExecute: false, skipReason: 'contains JSX' };

  const undeclared = findUndeclaredIdentifiers(code);
  if (undeclared.length > 0) {
    return { shouldExecute: false, skipReason: `undeclared: ${undeclared.slice(0, 3).join(', ')}` };
  }

  return { shouldExecute: true };
}

/** Type-safe property accessor for untyped acorn AST nodes. */
function prop(node: object, key: string): unknown {
  return (node as Record<string, unknown>)[key];
}

function propString(node: object, key: string): string | undefined {
  const val = prop(node, key);
  return typeof val === 'string' ? val : undefined;
}

function propNode(node: object, key: string): acorn.Node | undefined {
  const val = prop(node, key);
  return val && typeof val === 'object' && 'type' in (val as object)
    ? (val as acorn.Node)
    : undefined;
}

function propNodeArray(node: object, key: string): acorn.Node[] {
  const val = prop(node, key);
  return Array.isArray(val)
    ? val.filter((v): v is acorn.Node => v && typeof v === 'object' && 'type' in v)
    : [];
}

function findUndeclaredIdentifiers(code: string): string[] {
  let ast: acorn.Node;
  try {
    ast = acorn.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
    });
  } catch {
    return [];
  }

  const declared = new Set<string>();
  const referenced = new Set<string>();

  function walkNode(node: acorn.Node): void {
    if (!node || typeof node !== 'object') return;

    switch (node.type) {
      case 'VariableDeclarator': {
        const id = propNode(node, 'id');
        if (id) collectBindings(id);
        const init = propNode(node, 'init');
        if (init) walkNode(init);
        break;
      }
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression': {
        const id = propNode(node, 'id');
        if (id) {
          const name = propString(id, 'name');
          if (name) declared.add(name);
        }
        for (const param of propNodeArray(node, 'params')) collectBindings(param);
        const body = propNode(node, 'body');
        if (body) walkNode(body);
        break;
      }
      case 'ClassDeclaration': {
        const id = propNode(node, 'id');
        if (id) {
          const name = propString(id, 'name');
          if (name) declared.add(name);
        }
        const body = propNode(node, 'body');
        if (body) walkNode(body);
        break;
      }
      case 'Identifier': {
        const name = propString(node, 'name');
        if (name) referenced.add(name);
        break;
      }
      case 'MemberExpression': {
        const obj = propNode(node, 'object');
        if (obj) walkNode(obj);
        break;
      }
      case 'CatchClause': {
        const param = propNode(node, 'param');
        if (param) collectBindings(param);
        const body = propNode(node, 'body');
        if (body) walkNode(body);
        break;
      }
      case 'ForInStatement':
      case 'ForOfStatement': {
        const left = propNode(node, 'left');
        if (left) walkNode(left);
        const right = propNode(node, 'right');
        if (right) walkNode(right);
        const body = propNode(node, 'body');
        if (body) walkNode(body);
        break;
      }
      default:
        walkChildren(node);
    }
  }

  function walkChildren(node: acorn.Node): void {
    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'start' || key === 'end') continue;
      const val = prop(node, key);
      if (Array.isArray(val)) {
        for (const item of val) {
          if (item && typeof item === 'object' && 'type' in item) walkNode(item as acorn.Node);
        }
      } else if (val && typeof val === 'object' && 'type' in (val as object)) {
        walkNode(val as acorn.Node);
      }
    }
  }

  function collectBindings(node: acorn.Node): void {
    if (!node) return;
    switch (node.type) {
      case 'Identifier': {
        const name = propString(node, 'name');
        if (name) declared.add(name);
        break;
      }
      case 'ObjectPattern':
        for (const p of propNodeArray(node, 'properties')) {
          const value = propNode(p, 'value');
          collectBindings(value ?? p);
        }
        break;
      case 'ArrayPattern':
        for (const el of propNodeArray(node, 'elements')) collectBindings(el);
        break;
      case 'AssignmentPattern': {
        const left = propNode(node, 'left');
        if (left) collectBindings(left);
        break;
      }
      case 'RestElement': {
        const arg = propNode(node, 'argument');
        if (arg) collectBindings(arg);
        break;
      }
    }
  }

  walkNode(ast);

  const undeclared: string[] = [];
  for (const ref of referenced) {
    if (!declared.has(ref) && !COMMON_GLOBALS.has(ref)) undeclared.push(ref);
  }
  return undeclared;
}

const SANDBOX_GLOBALS = [
  'var console = { log: function(){}, warn: function(){}, error: function(){}, info: function(){}, debug: function(){}, dir: function(){}, table: function(){} };',
  'var setTimeout = function(fn){ if(typeof fn === "function") fn(); return 0; };',
  'var setInterval = function(){ return 0; };',
  'var clearTimeout = function(){};',
  'var clearInterval = function(){};',
  'var fetch = function(){ return Promise.reject(new Error("fetch not available")); };',
  'var process = { env: {} };',
  'var require = function(m){ throw new Error("require not available: " + m); };',
  'var window = {};',
  'var document = {};',
].join('\n');

export async function executeCodeBlocks(blocks: CodeBlock[]): Promise<CodeExecutionResult[]> {
  const results: CodeExecutionResult[] = [];
  const executable: CodeBlock[] = [];

  for (const block of blocks) {
    const analysis = analyzeBlockForExecution(block);
    if (!analysis.shouldExecute) {
      results.push({ block, executed: false, skipReason: analysis.skipReason });
    } else {
      executable.push(block);
    }
  }

  if (executable.length === 0) return results;

  const quickjsModule = await import('quickjs-emscripten');
  const qjs = await quickjsModule.getQuickJS();

  for (const block of executable) {
    const runtime = qjs.newRuntime();
    runtime.setMemoryLimit(10 * 1024 * 1024);

    const deadline = Date.now() + 3000;
    runtime.setInterruptHandler(() => Date.now() > deadline);

    const context = runtime.newContext();

    try {
      context.evalCode(SANDBOX_GLOBALS);
      const evalResult = context.evalCode(block.code);

      if (evalResult.error) {
        const errorHandle = evalResult.error;
        const errorProps = context.dump(errorHandle) as { name?: string; message?: string } | null;
        errorHandle.dispose();

        const errorType = String(errorProps?.name ?? 'Error');
        const errorMessage = String(errorProps?.message ?? String(errorProps));

        if (errorMessage.includes('interrupted')) {
          results.push({
            block,
            executed: true,
            error: { type: 'TimeoutError', message: 'Code execution exceeded 3 second timeout' },
          });
        } else {
          results.push({
            block,
            executed: true,
            error: { type: errorType, message: errorMessage },
          });
        }
      } else {
        if (evalResult.value) evalResult.value.dispose();
        results.push({ block, executed: true });
      }
    } catch (err) {
      results.push({
        block,
        executed: true,
        error: {
          type: 'ExecutionError',
          message: err instanceof Error ? err.message : String(err),
        },
      });
    } finally {
      try {
        context.dispose();
      } catch (_) {
        /* QuickJS runtime may be corrupted after stack overflow */
      }
      try {
        runtime.dispose();
      } catch (_) {
        /* QuickJS runtime may be corrupted after stack overflow */
      }
    }
  }

  return results;
}
