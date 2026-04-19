import { glob } from 'glob';
import * as path from 'node:path';
import * as fs from 'node:fs';

/**
 * Discover markdown files (.md, .mdx) in the given directory paths.
 * If docPaths is empty, searches the entire repo root.
 * Handles both directory paths (docs/) and file paths (README.md).
 */
export async function discoverMarkdownFiles(
  repoRoot: string,
  docPaths?: string[],
): Promise<string[]> {
  const allFiles: string[] = [];

  if (!docPaths || docPaths.length === 0) {
    // Search entire repo
    const files = await glob('**/*.{md,mdx}', {
      cwd: repoRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**'],
      nodir: true,
    });
    allFiles.push(...files);
  } else {
    for (const docPath of docPaths) {
      const resolved = path.resolve(repoRoot, docPath);

      // Check if it's a file
      try {
        const stat = fs.statSync(resolved);
        if (stat.isFile() && /\.(md|mdx)$/i.test(resolved)) {
          allFiles.push(resolved);
          continue;
        }
      } catch {
        // Path doesn't exist as-is, try as glob pattern
      }

      // Check if it's a directory
      try {
        const stat = fs.statSync(resolved);
        if (stat.isDirectory()) {
          const files = await glob('**/*.{md,mdx}', {
            cwd: resolved,
            absolute: true,
            ignore: ['**/node_modules/**', '**/.git/**'],
            nodir: true,
          });
          allFiles.push(...files);
          continue;
        }
      } catch {
        // Not a directory either
      }

      // Try as a glob pattern from repo root
      const files = await glob(docPath, {
        cwd: repoRoot,
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**'],
        nodir: true,
      });
      allFiles.push(...files.filter((f) => /\.(md|mdx)$/i.test(f)));
    }
  }

  return [...new Set(allFiles)].sort();
}
