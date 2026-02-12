import { execSync } from 'child_process';

export function run(cmd, fallback = '') {
  try { return execSync(cmd, { timeout: 5000 }).toString().trim(); }
  catch { return fallback; }
}
