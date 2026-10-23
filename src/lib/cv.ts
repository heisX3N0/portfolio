// SPEC 4.5: the owner supplies each CV. A missing file is a visible TODO(owner), not a failed build.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** The TODO(owner) text when the CV file is missing from publicDir, or undefined when it is there. */
export function cvTodo(publicDir: string, cvFile: string): string | undefined {
  if (existsSync(join(publicDir, cvFile))) return undefined;
  return `TODO(owner): add the CV as public${cvFile} (keep that file name).`;
}
