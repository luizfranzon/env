#!/usr/bin/env bash
# Recolore a aba do kitty conforme o hook do Claude Code disparado.
# Título fica intocado (o Claude Code já define o próprio título da sessão).
# Silencioso se remote control do kitty estiver off ou não for kitty.
set -uo pipefail

input=$(cat)
event=$(printf '%s' "$input" | jq -r '.hook_event_name // empty' 2>/dev/null)

set_tab_color() {
  # $1=active_bg $2=active_fg $3=inactive_bg $4=inactive_fg
  kitty @ set-tab-color --match "id:${KITTY_WINDOW_ID:-0}" \
    active_bg="$1" active_fg="$2" inactive_bg="$3" inactive_fg="$4" 2>/dev/null
}

# Aba ativa: cor clara do evento. Aba inativa: mesma cor escurecida (~42%),
# com foreground recalculado em cada par p/ manter contraste (fundo claro -> texto
# escuro, fundo escuro -> texto claro).
case "$event" in
  SessionStart)
    set_tab_color "#2b4a66" "#ffffff" "#121f2a" "#ffffff" ;;
  UserPromptSubmit)
    set_tab_color "#f9e2af" "#171423" "#685e49" "#ffffff" ;;
  PreToolUse)
    set_tab_color "#fab387" "#171423" "#694b38" "#ffffff" ;;
  PostToolUse)
    set_tab_color "#89b4fa" "#171423" "#394b69" "#ffffff" ;;
  Notification)
    set_tab_color "#f38ba8" "#171423" "#663a46" "#ffffff" ;;
  Stop)
    set_tab_color "#a6e3a1" "#171423" "#245c32" "#ffffff" ;;
  SessionEnd)
    set_tab_color "#87CEFA" "#171423" "#385669" "#ffffff" ;;
esac

exit 0
