/**
 * Auto-discover agents from ~/.clawdbot/clawdbot.json or ~/.openclaw/openclaw.json
 * Fallback when agents.json doesn't exist.
 *
 * Reads the gateway config to find:
 *  - Gateway loopback port + auth token
 *  - Agent list with workspaces
 *  - Default workspace for agents without explicit workspace
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Discover agents from OpenClaw configuration
 */
function discoverOpenClawAgents() {
  const openclawDir = join(homedir(), '.openclaw');
  const configPath = join(openclawDir, 'openclaw.json');

  if (!existsSync(configPath)) {
    return null;
  }

  let config;
  try {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.warn(`⚠️  Failed to parse ${configPath}: ${e.message}`);
    return null;
  }

  // Gateway connection - OpenClaw uses gateway.port and gateway.auth.token
  const gatewayConfig = config.gateway || {};
  const port = gatewayConfig.port || 18789;
  const token = gatewayConfig.auth?.token || '';
  
  if (!token) {
    console.warn('⚠️  No gateway auth token found in OpenClaw config.');
    return null;
  }

  console.log(`📡 OpenClaw Gateway: localhost:${port}`);

  // Default workspace
  const defaultWorkspace = config.agents?.defaults?.workspace || join(homedir(), '.openclaw', 'workspace');

  // OpenClaw typically has a single 'main' agent by default
  const discovered = [];

  // Try to read from agents config if available
  const agentDefaults = config.agents?.defaults || {};
  const modelConfig = agentDefaults.model || {};
  const primaryModel = modelConfig.primary || 'default';

  // Main agent
  const mainAgent = {
    id: 'main',
    gatewayAgentId: 'main',
    name: 'Main',
    emoji: '🦞',
    host: '127.0.0.1',
    port,
    token,
    workspace: defaultWorkspace,
    type: 'openclaw',
  };

  // Try to read SOUL.md from workspace for name/emoji
  const soulPath = join(defaultWorkspace, 'SOUL.md');
  if (existsSync(soulPath)) {
    try {
      const soul = readFileSync(soulPath, 'utf8').slice(0, 500);
      const nameMatch = soul.match(/\*\*Name:\*\*\s*(.+)/i) || soul.match(/You are (\w+)/i);
      if (nameMatch) mainAgent.name = nameMatch[1].trim();
      
      const emojiMatch = soul.match(/\*\*Emoji:\*\*\s*(.+)/);
      if (emojiMatch) {
        const e = emojiMatch[1].trim();
        if (e && e.length <= 4 && !e.startsWith('*')) mainAgent.emoji = e;
      }
    } catch {}
  }

  discovered.push(mainAgent);
  console.log(`  ✓ ${mainAgent.emoji} ${mainAgent.name} (main) → ${defaultWorkspace} [OpenClaw]`);

  // Check for additional agents in workspace/agents directory
  const agentsDir = join(openclawDir, 'agents');
  if (existsSync(agentsDir)) {
    const subdirs = readdirSync(agentsDir).filter(name => {
      try { return statSync(join(agentsDir, name)).isDirectory(); }
      catch { return false; }
    });
    
    for (const agentId of subdirs) {
      if (agentId === 'main') continue; // Already added
      
      const agent = {
        id: agentId,
        gatewayAgentId: agentId,
        name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
        emoji: '🤖',
        host: '127.0.0.1',
        port,
        token,
        workspace: join(agentsDir, agentId),
        type: 'openclaw',
      };
      
      // Try to read SOUL.md for this agent
      const agentSoulPath = join(agent.workspace, 'SOUL.md');
      if (existsSync(agentSoulPath)) {
        try {
          const soul = readFileSync(agentSoulPath, 'utf8').slice(0, 500);
          const nameMatch = soul.match(/\*\*Name:\*\*\s*(.+)/i) || soul.match(/You are (\w+)/i);
          if (nameMatch) agent.name = nameMatch[1].trim();
        } catch {}
      }
      
      discovered.push(agent);
      console.log(`  ✓ ${agent.emoji} ${agent.name} (${agentId}) → ${agent.workspace} [OpenClaw]`);
    }
  }

  return {
    agents: discovered,
    pollIntervalMs: 15000,
    hostMetricsIntervalMs: 30000,
    type: 'openclaw',
  };
}

/**
 * Discover agents from Clawdbot configuration
 */
function discoverClawdbotAgents() {
  const clawdbotDir = join(homedir(), '.clawdbot');
  const configPath = join(clawdbotDir, 'clawdbot.json');

  if (!existsSync(configPath)) {
    return null;
  }

  let config;
  try {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.warn(`⚠️  Failed to parse ${configPath}: ${e.message}`);
    return null;
  }

  // Gateway connection
  const port = config.gateway?.loopback?.port || 18789;
  const token = config.gateway?.auth?.token || '';
  if (!token) {
    console.warn('⚠️  No gateway auth token found in Clawdbot config.');
    return null;
  }
  console.log(`📡 Clawdbot Gateway: localhost:${port}`);

  // Default workspace (used for agents without explicit workspace)
  const agentsConfig = config.agents || {};
  const defaults = agentsConfig.defaults || {};
  const defaultWorkspace = defaults.workspace || join(homedir(), 'clawd');

  // Agent list from config (can be under .agents or .list depending on version)
  const agentList = agentsConfig.agents || agentsConfig.list || [];
  const discovered = [];

  for (const agentCfg of agentList) {
    const id = agentCfg.id;
    if (!id) continue;

    const workspace = agentCfg.workspace || defaultWorkspace;
    let name = agentCfg.name || id.charAt(0).toUpperCase() + id.slice(1);
    let emoji = '🤖';

    // Try to read SOUL.md from workspace for name/emoji
    const soulPath = join(workspace, 'SOUL.md');
    if (existsSync(soulPath)) {
      try {
        const soul = readFileSync(soulPath, 'utf8').slice(0, 500);
        const nameMatch = soul.match(/You are (\w+)/i);
        if (nameMatch) name = nameMatch[1];
      } catch {}
    }

    // Try IDENTITY.md for emoji
    const idPath = join(workspace, 'IDENTITY.md');
    if (existsSync(idPath)) {
      try {
        const identity = readFileSync(idPath, 'utf8').slice(0, 500);
        const emojiMatch = identity.match(/\*\*Emoji:\*\*\s*(.+)/);
        if (emojiMatch) {
          const e = emojiMatch[1].trim();
          // Only use if it's an actual emoji (1-4 chars, not placeholder text)
          if (e && e.length <= 4 && !e.startsWith('*')) emoji = e;
        }
      } catch {}
    }

    discovered.push({
      id,
      gatewayAgentId: id,
      name,
      emoji,
      host: '127.0.0.1',
      port,
      token,
      workspace,
      type: 'clawdbot',
    });

    console.log(`  ✓ ${emoji} ${name} (${id}) → ${workspace} [Clawdbot]`);
  }

  if (discovered.length === 0) {
    // Fallback: scan ~/.clawdbot/agents/ directory for agent subdirs
    const agentsDir = join(clawdbotDir, 'agents');
    if (existsSync(agentsDir)) {
      const subdirs = readdirSync(agentsDir).filter(name => {
        try { return statSync(join(agentsDir, name)).isDirectory(); }
        catch { return false; }
      });
      for (const agentId of subdirs) {
        discovered.push({
          id: agentId,
          gatewayAgentId: agentId,
          name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
          emoji: '🤖',
          host: '127.0.0.1',
          port,
          token,
          workspace: agentId === 'main' ? defaultWorkspace : join(defaultWorkspace, '..', 'clawd-agents', agentId),
          type: 'clawdbot',
        });
        console.log(`  ✓ 🤖 ${agentId} (directory scan) [Clawdbot]`);
      }
    }
  }

  return {
    agents: discovered,
    pollIntervalMs: 15000,
    hostMetricsIntervalMs: 30000,
    type: 'clawdbot',
  };
}

/**
 * Main discovery function - tries OpenClaw first, then Clawdbot
 */
export function discoverAgents() {
  // Try OpenClaw first
  const openclawResult = discoverOpenClawAgents();
  if (openclawResult && openclawResult.agents.length > 0) {
    console.log(`📋 Discovered ${openclawResult.agents.length} agent(s) from OpenClaw`);
    return openclawResult;
  }

  // Fall back to Clawdbot
  const clawdbotResult = discoverClawdbotAgents();
  if (clawdbotResult && clawdbotResult.agents.length > 0) {
    console.log(`📋 Discovered ${clawdbotResult.agents.length} agent(s) from Clawdbot`);
    return clawdbotResult;
  }

  // Neither found
  console.log('ℹ️  No ~/.openclaw/openclaw.json or ~/.clawdbot/clawdbot.json found. Create agents.json manually.');
  return { agents: [], pollIntervalMs: 15000, hostMetricsIntervalMs: 30000, type: null };
}
