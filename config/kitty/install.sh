#!/usr/bin/env bash
# Instala a config do kitty deste repo (tema, atalhos, remote control) e o hook
# de abas do Claude Code (~/.claude/hooks/kitty-tab-hook.sh), registrando-o em
# ~/.claude/settings.json sem tocar no resto do arquivo (env, model, etc).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

KITTY_CONF_DIR="$HOME/.config/kitty"
CLAUDE_HOOKS_DIR="$HOME/.claude/hooks"
SETTINGS="$HOME/.claude/settings.json"
HOOK_CMD="$CLAUDE_HOOKS_DIR/kitty-tab-hook.sh"

echo "==> Config do kitty -> $KITTY_CONF_DIR"
mkdir -p "$KITTY_CONF_DIR"
if [[ -f "$KITTY_CONF_DIR/kitty.conf" ]] && ! diff -q "$SCRIPT_DIR/kitty.conf" "$KITTY_CONF_DIR/kitty.conf" >/dev/null 2>&1; then
  backup="$KITTY_CONF_DIR/kitty.conf.bak.$(date +%Y%m%d%H%M%S)"
  echo "    kitty.conf existente é diferente, backup em $backup"
  cp "$KITTY_CONF_DIR/kitty.conf" "$backup"
fi
cp "$SCRIPT_DIR/kitty.conf" "$KITTY_CONF_DIR/kitty.conf"
[[ -f "$SCRIPT_DIR/gnome-dark.conf" ]] && cp "$SCRIPT_DIR/gnome-dark.conf" "$KITTY_CONF_DIR/gnome-dark.conf"
[[ -f "$SCRIPT_DIR/theme.conf" ]] && cp "$SCRIPT_DIR/theme.conf" "$KITTY_CONF_DIR/theme.conf"

echo "==> Hook de abas -> $HOOK_CMD"
mkdir -p "$CLAUDE_HOOKS_DIR"
cp "$REPO_ROOT/claude/hooks/kitty-tab-hook.sh" "$HOOK_CMD"
chmod +x "$HOOK_CMD"

if ! command -v jq >/dev/null 2>&1; then
  echo "!! jq não encontrado — instale jq e registre o hook manualmente em $SETTINGS (ver claude/README.md)." >&2
  exit 1
fi

echo "==> Registrando hook em $SETTINGS"
mkdir -p "$(dirname "$SETTINGS")"
[[ -f "$SETTINGS" ]] || echo '{}' > "$SETTINGS"
tmp=$(mktemp)
jq --arg cmd "$HOOK_CMD" -f "$SCRIPT_DIR/merge-hooks.jq" "$SETTINGS" > "$tmp"
mv "$tmp" "$SETTINGS"

cat <<'EOF'

Pronto.

IMPORTANTE: reinicie o kitty (fechar e abrir de novo — reload de config
não é suficiente) pra allow_remote_control/listen_on entrarem em vigor.
Sem isso o hook roda mas os comandos "kitty @" falham silenciosamente.
EOF
