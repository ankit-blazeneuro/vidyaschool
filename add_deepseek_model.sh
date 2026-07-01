#!/usr/bin/env bash
# add_deepseek_model.sh
# Adds deepseek-ai/deepseek-v4-pro (via NVIDIA's same OpenAI-compatible endpoint)
# as a second provider in the existing claude-code-router config, and adds a
# 'claude-deepseek' alias alongside the existing 'claude-nemotron' one.
#
# Requires: setup_nemotron_claude_code.sh must have been run already
# (uses the same NVIDIA key file and pm2-managed router).

set -e

KEY_FILE="$HOME/.config/nvidia/api_key"
CONFIG_DIR="$HOME/.claude-code-router"
CONFIG_FILE="$CONFIG_DIR/config.json"
ROUTER_PORT=3456
PM2_APP_NAME="claude-code-router"

if [ ! -f "$KEY_FILE" ]; then
    echo "❌ No NVIDIA key found at $KEY_FILE. Run setup_nemotron_claude_code.sh first."
    exit 1
fi
NVIDIA_API_KEY=$(cat "$KEY_FILE")

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ No router config found at $CONFIG_FILE. Run setup_nemotron_claude_code.sh first."
    exit 1
fi

echo "📝 Updating router config to add deepseek-ai/deepseek-v4-pro..."

# Rewrite config with both providers. Using a fresh heredoc is simplest/safest
# here rather than trying to JSON-patch in bash.
cat > "$CONFIG_FILE" << EOF
{
  "Providers": [
    {
      "name": "nvidia",
      "api_base_url": "https://integrate.api.nvidia.com/v1/chat/completions",
      "api_key": "${NVIDIA_API_KEY}",
      "models": ["nvidia/nemotron-3-ultra-550b-a55b"]
    },
    {
      "name": "nvidia-deepseek",
      "api_base_url": "https://integrate.api.nvidia.com/v1/chat/completions",
      "api_key": "${NVIDIA_API_KEY}",
      "models": ["deepseek-ai/deepseek-v4-pro"]
    }
  ],
  "Router": {
    "default": "nvidia,nvidia/nemotron-3-ultra-550b-a55b"
  },
  "PORT": ${ROUTER_PORT}
}
EOF
chmod 600 "$CONFIG_FILE"
echo "✅ Config updated (default route stays on Nemotron; DeepSeek available on demand)."

# ---- Add claude-deepseek alias ----
SHELL_RC="$HOME/.bashrc"
[ -n "$ZSH_VERSION" ] || [ -f "$HOME/.zshrc" ] && SHELL_RC="$HOME/.zshrc"

if grep -q "alias claude-deepseek=" "$SHELL_RC" 2>/dev/null; then
    echo "✅ 'claude-deepseek' alias already present in $SHELL_RC."
else
    {
        echo "alias claude-deepseek='ANTHROPIC_BASE_URL=http://localhost:${ROUTER_PORT} ANTHROPIC_AUTH_TOKEN=dummy-token ANTHROPIC_MODEL=\"nvidia-deepseek,deepseek-ai/deepseek-v4-pro\" claude'"
    } >> "$SHELL_RC"
    echo "✅ Added 'claude-deepseek' alias to $SHELL_RC."
fi

# ---- Restart router to pick up new config ----
echo ""
echo "🔄 Restarting router to load new config..."
pm2 restart "$PM2_APP_NAME" --update-env
pm2 save

sleep 2
if pm2 describe "$PM2_APP_NAME" | grep -q "online"; then
    echo "✅ Router restarted and online with both models."
else
    echo "⚠️  Router may not have restarted cleanly. Check: pm2 logs $PM2_APP_NAME"
fi

echo ""
echo "🎯 Done. You now have:"
echo "   claude              -> normal Claude Code (Anthropic models)"
echo "   claude-nemotron      -> Nemotron-3-Ultra-550B"
echo "   claude-deepseek       -> DeepSeek-V4-Pro"
echo ""
echo "   (open a new terminal or run 'source $SHELL_RC' to load the new alias)"
