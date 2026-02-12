# 🏰 Clawd Control

Real-time dashboard for monitoring and managing [OpenClaw](https://github.com/openclaw/openclaw) and [Clawdbot](https://github.com/clawdbot/clawdbot) AI agents.

<!-- Screenshot -->
![Clawd Control Dashboard](docs/screenshot.png)
-->

## What is this?

Clawd Control gives you a single-screen view of your entire AI agent fleet. If you run [OpenClaw](https://github.com/openclaw/openclaw) or [Clawdbot](https://github.com/clawdbot/clawdbot) agents, this is your mission control.

## Supported Platforms

- ✅ **OpenClaw** — Primary support (detects `~/.openclaw/openclaw.json`)
- ✅ **Clawdbot** — Legacy support (detects `~/.clawdbot/clawdbot.json`)

## Features

- **Live monitoring** — Real-time status, health, and metrics via SSE
- **Fleet overview** — See all agents at a glance with health indicators
- **Agent detail views** — Deep dive into any agent's sessions, channels, config
- **Agent creation wizard** — Spin up new agents with guided setup (Clawdbot only)
- **Host metrics** — CPU, RAM, disk usage for your machine
- **Auto-discovery** — Finds local OpenClaw/Clawdbot agents automatically
- **SPA navigation** — Instant page transitions, no reloads
- **Dark/light theme** — Toggle with `T`, or follows system preference
- **Password auth** — Simple session-based authentication
- **Keyboard shortcuts** — `B` toggle sidebar, `T` toggle theme, `?` for help

## Quick Start

```bash
# Clone
git clone https://github.com/hjw21century/clawd-control.git
cd clawd-control
npm install

# Run — auto-discovers local OpenClaw/Clawdbot agents
npm start
```

Open `http://localhost:3100` and log in with the generated password (printed to console on first run).

### Manual agent configuration

If auto-discovery doesn't find your agents (remote hosts, custom ports):

```bash
cp agents.example.json agents.json
```

Edit `agents.json`:

```json
{
  "agents": [
    {
      "id": "my-agent",
      "gatewayAgentId": "main",
      "name": "My Agent",
      "emoji": "🤖",
      "host": "127.0.0.1",
      "port": 18789,
      "token": "YOUR_GATEWAY_TOKEN",
      "workspace": "/path/to/agent/workspace",
      "type": "openclaw"
    }
  ],
  "pollIntervalMs": 15000,
  "hostMetricsIntervalMs": 30000
}
```

**Note:** The `type` field is optional and auto-detected. Use `"openclaw"` or `"clawdbot"` to explicitly specify.

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `--port` | `3100` | HTTP port |
| `--bind` | `0.0.0.0` | Bind address (use `127.0.0.1` for local-only) |

### Authentication

On first run, a random password is generated and saved to `auth.json`. You'll see it in the console output. To set your own:

```json
{
  "password": "your-password-here",
  "sessionTtlHours": 24
}
```

## Architecture

Clawd Control is deliberately simple — a single Node.js server with no build step, no framework, no bundler. The frontend is vanilla HTML/JS with a shared layout module.

```
server.mjs          → HTTP server, SSE, auth, API proxy
layout.js           → Shared sidebar, topbar, theme, navigation
dashboard.html      → Fleet overview (main page)
agent-detail.html   → Individual agent deep dive
create.html         → Agent creation wizard
collector.mjs       → Background data collector (polls agents)
discover.mjs        → Auto-discovers local OpenClaw/Clawdbot agents
create-agent.mjs    → Agent provisioning logic (Clawdbot only)
check.mjs           → Diagnostic checks
security-lib/       → Auth, rate limiting, security headers
```

### Auto-Discovery

The dashboard automatically detects your agents by reading:

1. **OpenClaw**: `~/.openclaw/openclaw.json`
   - Gateway: `config.gateway.port` + `config.gateway.auth.token`
   - Agents: Reads from `config.agents` and scans `~/.openclaw/agents/`
   - Workspace: `config.agents.defaults.workspace`

2. **Clawdbot**: `~/.clawdbot/clawdbot.json`
   - Gateway: `config.gateway.loopback.port` + `config.gateway.auth.token`
   - Agents: Reads from `config.agents.agents` or scans `~/.clawdbot/agents/`
   - Workspace: `config.agents.defaults.workspace`

### Requirements

- **Node.js** 18+ (uses native fetch)
- **OpenClaw** or **Clawdbot** agents running locally or on your network
- One dependency: `ws` (WebSocket client for agent communication)

## Platform Differences

| Feature | OpenClaw | Clawdbot |
|---------|----------|----------|
| Auto-discovery | ✅ `~/.openclaw/openclaw.json` | ✅ `~/.clawdbot/clawdbot.json` |
| Agent creation wizard | ❌ Manual setup | ✅ Built-in wizard |
| Multiple agents | ✅ Supported | ✅ Supported |
| Gateway protocol | WebSocket | WebSocket |

## FAQ

**Q: Do I need OpenClaw or Clawdbot installed?**
Yes — Clawd Control is a dashboard *for* OpenClaw/Clawdbot agents. Install one of them first:
- OpenClaw: `npm install -g openclaw` (or see [docs](https://docs.openclaw.ai))
- Clawdbot: `npm install -g clawdbot`

**Q: Can I monitor remote agents?**
Yes — add them to `agents.json` with their host/port/token. The agents need to be network-reachable.

**Q: Can I use both OpenClaw and Clawdbot at the same time?**
Currently, auto-discovery picks one platform (OpenClaw preferred). For mixed environments, manually configure all agents in `agents.json`.

**Q: Is this related to Temaki?**
Clawd Control is a standalone open-source project. The original version pairs well with [Temaki.ai](https://temaki.ai). This fork adds OpenClaw support.

## Contributing

Contributions welcome! This project favors simplicity — no build tools, no frameworks, vanilla everything. If your PR adds a `node_modules` folder the size of a small country, we need to talk.

### Fork Changes

This fork (`hjw21century/clawd-control`) adds:
- ✅ OpenClaw support
- ✅ Auto-detection of both OpenClaw and Clawdbot
- ✅ Updated documentation

## License

MIT — do whatever you want with it.
