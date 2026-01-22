---
name: config-router
description: Update Claude Code Router configuration. Use when the user wants to add providers, change models, modify routing rules, or adjust global/project-level settings for Claude Code Router.
allowed-tools: Read, Bash(cat:*), Bash(ccr:*), Edit
---

# Claude Code Router Configuration

Help users modify their Claude Code Router configuration based on their requests.

## Configuration File Locations

### Global Configuration
- **Path**: `~/.claude-code-router/config.json`
- **Scope**: Applies to all projects unless overridden

### Project-Level Configuration
- **Path**: `~/.claude/projects/<project-id>/claude-code-router.json`
- **Scope**: Applies only to the specific project
- **Find project ID**: Run `ccr status` in the project directory

## Configuration Structure

### Global Config (`~/.claude-code-router/config.json`)

```json
{
  "HOST": "127.0.0.1",
  "PORT": 3456,
  "LOG": true,
  "LOG_LEVEL": "info",
  "APIKEY": "optional-api-key",
  "Providers": [
    {
      "name": "provider-name",
      "baseUrl": "https://api.example.com/v1",
      "apiKey": "$ENV_VARIABLE_NAME",
      "models": ["model-1", "model-2"]
    }
  ],
  "Router": {
    "default": "provider-name,model-name",
    "background": "provider-name,model-name",
    "think": "provider-name,model-name",
    "longContext": "provider-name,model-name"
  }
}
```

### Project-Level Config (`claude-code-router.json`)

```json
{
  "Router": {
    "default": "provider-name,model-name",
    "background": "provider-name,model-name"
  }
}
```

## Configuration Fields Reference

### Core Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `HOST` | string | `"127.0.0.1"` | Listen address |
| `PORT` | number | `3456` | Listen port |
| `LOG` | boolean | `true` | Enable logging |
| `LOG_LEVEL` | string | `"info"` | Log level (debug, info, warn, error) |
| `APIKEY` | string | - | Optional API key to protect the service |

### Provider Configuration

Each provider in the `Providers` array requires:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique provider identifier (e.g., "openai", "anthropic") |
| `baseUrl` | string | API endpoint URL |
| `apiKey` | string | API key (supports `$ENV_VARIABLE` syntax) |
| `models` | string[] | List of available model names |

### Router Configuration

The `Router` object maps request types to provider/model combinations:

| Key | Description |
|-----|-------------|
| `default` | Primary routing for standard requests |
| `background` | Lower-priority background tasks |
| `think` | Extended reasoning/thinking tasks |
| `longContext` | High token-limit operations |

**Format**: `"provider-name,model-name"` (e.g., `"openai,gpt-4"`)

## Configuration Priority (Highest to Lowest)

1. Custom routing functions
2. Project-level settings
3. Global configuration
4. Built-in defaults

## Common Provider Examples

### OpenAI

```json
{
  "name": "openai",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "$OPENAI_API_KEY",
  "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]
}
```

### Anthropic

```json
{
  "name": "anthropic",
  "baseUrl": "https://api.anthropic.com/v1",
  "apiKey": "$ANTHROPIC_API_KEY",
  "models": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"]
}
```

## Workflow

When the user requests configuration changes:

1. **Determine scope**: Ask if they want global or project-level changes if unclear
2. **Read current config**:
   - Global: `cat ~/.claude-code-router/config.json`
   - Project: Run `ccr status` first to get project ID
3. **Validate changes**: Ensure provider names match, models are listed in providers, format is correct
4. **Apply changes**: Edit the appropriate JSON file
5. **Verify**: Run `ccr status` to confirm changes took effect

## Applying Configuration Changes

To apply configuration changes, use `ccr restart`:

```bash
ccr restart
```

**IMPORTANT**: Never use `ccr stop` followed by `ccr start` separately. When running inside a Claude Code session that uses the router proxy, executing `ccr stop` will terminate the proxy connection and prevent any further commands (including `ccr start`) from being processed. Always use `ccr restart` which atomically restarts the service without breaking the session.

## Important Notes

- Always use environment variables (`$ENV_NAME`) for API keys - never hardcode secrets
- Check logs at `~/.claude-code-router/claude-code-router.log` for troubleshooting
- Project-level configs only support `Router` settings, not `Providers`
- Always use `ccr restart` (not `ccr stop` + `ccr start`) to apply changes

$ARGUMENTS
