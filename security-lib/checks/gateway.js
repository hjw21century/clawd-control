import fs from 'fs';
import path from 'path';
import os from 'os';

export function checkGatewayConfig() {
  const results = [];
  
  // Check both OpenClaw and Clawdbot config paths
  const openclawPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
  const clawdbotPath = path.join(os.homedir(), '.clawdbot', 'clawdbot.json');
  
  let configPath = null;
  let platform = 'unknown';
  
  if (fs.existsSync(openclawPath)) {
    configPath = openclawPath;
    platform = 'OpenClaw';
  } else if (fs.existsSync(clawdbotPath)) {
    configPath = clawdbotPath;
    platform = 'Clawdbot';
  }
  
  if (!configPath) {
    results.push({ name: 'Gateway config', status: 'warn', detail: 'No OpenClaw or Clawdbot config found' });
    return results;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const hasAuth = config.gateway?.auth?.token || config.gateway?.auth?.password;
    results.push({ name: 'Gateway authentication', status: hasAuth ? 'pass' : 'info', detail: hasAuth ? `Auth token configured (${platform})` : `No gateway auth (${platform} local-only is OK)` });
    const channels = config.channels || {};
    const activeChannels = Object.keys(channels).filter(k => channels[k]?.enabled !== false);
    results.push({ name: 'Active channels', status: 'info', detail: activeChannels.join(', ') || 'None' });
    const elevated = config.tools?.exec?.elevated;
    results.push({ name: 'Elevated exec', status: elevated ? 'warn' : 'pass', detail: elevated ? 'Elevated commands allowed' : 'Elevated commands disabled' });
    const execSecurity = config.tools?.exec?.security || 'default';
    results.push({ name: 'Exec security mode', status: execSecurity === 'full' ? 'warn' : 'pass', detail: `Mode: ${execSecurity}` });
  } catch (e) {
    results.push({ name: 'Gateway config', status: 'fail', detail: 'Failed to parse: ' + e.message });
  }
  return results;
}
