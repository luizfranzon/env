#!/usr/bin/env bash
# Recolore a aba do kitty conforme o hook do Claude Code disparado.
# Título fica intocado (o Claude Code já define o próprio título da sessão).
# Silencioso se remote control do kitty estiver off ou não for kitty.
set -uo pipefail

input=$(cat)
event=$(printf '%s' "$input" | jq -r '.hook_event_name // empty' 2>/dev/null)
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty' 2>/dev/null)

WIN_ID="${KITTY_WINDOW_ID:-0}"
BLINK_PIDFILE="/tmp/kitty-tab-blink-${WIN_ID}.pid"

set_tab_color() {
  # $1=active_bg $2=active_fg $3=inactive_bg $4=inactive_fg
  kitty @ set-tab-color --match "id:${WIN_ID}" \
    active_bg="$1" active_fg="$2" inactive_bg="$3" inactive_fg="$4" 2>/dev/null
}

stop_blink() {
  if [[ -f "$BLINK_PIDFILE" ]]; then
    local pid
    pid=$(cat "$BLINK_PIDFILE" 2>/dev/null)
    [[ -n "$pid" ]] && kill -TERM -- "-${pid}" 2>/dev/null
    rm -f "$BLINK_PIDFILE"
  fi
}

start_blink_purple() {
  setsid bash -c '
    while true; do
      kitty @ set-tab-color --match "id:'"$WIN_ID"'" active_bg="#cba6f7" active_fg="#171423" inactive_bg="#6c3fa0" inactive_fg="#ffffff" 2>/dev/null
      sleep 0.5
      kitty @ set-tab-color --match "id:'"$WIN_ID"'" active_bg="#3b1f5c" active_fg="#ffffff" inactive_bg="#241238" inactive_fg="#ffffff" 2>/dev/null
      sleep 0.5
    done
  ' >/dev/null 2>&1 &
  echo $! > "$BLINK_PIDFILE"
  disown
}

# Toda invocação primeiro cancela um blink anterior em andamento.
stop_blink

# Aba ativa: cor clara do evento. Aba inativa: mesma cor escurecida (~42%),
# com foreground recalculado em cada par p/ manter contraste (fundo claro -> texto
# escuro, fundo escuro -> texto claro).
if [[ "$event" == "Notification" ]] || { [[ "$event" == "PreToolUse" ]] && [[ "$tool" == "AskUserQuestion" ]]; }; then
  # Aguardando resposta do usuário: roxo piscando.
  start_blink_purple
else
  case "$event" in
    SessionStart)
      set_tab_color "#2b4a66" "#ffffff" "#121f2a" "#ffffff" ;;
    UserPromptSubmit|PreToolUse|PostToolUse)
      set_tab_color "#fab387" "#171423" "#694b38" "#ffffff" ;;
    Stop)
      set_tab_color "#a6e3a1" "#171423" "#245c32" "#ffffff" ;;
    SessionEnd)
      set_tab_color "#87CEFA" "#171423" "#385669" "#ffffff" ;;
  esac
fi

exit 0
