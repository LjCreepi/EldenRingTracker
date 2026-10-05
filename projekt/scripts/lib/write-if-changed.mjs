import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * Write `content` to `file` only when its bytes actually change, so repeated
 * runs don't churn committed output. Line endings are normalised before the
 * compare so `core.autocrlf` checkouts don't count as a change. Returns true
 * if the file was (re)written.
 */
export function writeIfChanged(file, content) {
  const current = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (current !== null && current.replace(/\r\n/g, '\n') === content) {
    console.log('unchanged:', file.slice(file.lastIndexOf('assets')));
    return false;
  }
  writeFileSync(file, content);
  console.log('wrote:    ', file.slice(file.lastIndexOf('assets')));
  return true;
}
