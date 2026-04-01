import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Walks up from cwd looking for .ferret/ or ferret.config.json.
 * Falls back to cwd if neither is found.
 */
export function findProjectRoot(startDir: string = process.cwd()): string {
  let current = path.resolve(startDir);

  for (let i = 0; i < 20; i++) {
    if (
      fs.existsSync(path.join(current, '.ferret')) ||
      fs.existsSync(path.join(current, 'ferret.config.json'))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break; // filesystem root
    current = parent;
  }

  return path.resolve(startDir);
}
