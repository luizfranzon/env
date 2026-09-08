# Claude Config

## Skills

Skills customizadas ficam em `skills/`. Para instalar, copie cada pasta para `~/.claude/skills/`.

| Skill | Descrição |
|-------|-----------|
| `commit-message` | Gera 5 sugestões de commit em PT-BR seguindo a convenção `#TICKET - Verbo Descrição` |
| `migrate-band` | Migra widgets do motor antigo (ComponentChooser) para o novo (DynamicFormRenderer) no MobileCore |
| `translate` | Adiciona chaves i18n nos arquivos pt.json, en.json e es.json |

## Statusline

O script `statusline/statusline-command.js` exibe: modelo ativo, contexto usado, custo, rate limits (5h e 7d).

**Configuração no `~/.claude/settings.json`:**

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/statusline-command.js"
  }
}
```

Copie o script para `~/.claude/statusline-command.js`.

## Hook de abas do kitty

O script `hooks/kitty-tab-hook.sh` recolore/renomeia a aba do kitty conforme o hook do Claude Code disparado (pensando, executando tool, aguardando input, pronto, etc), com cor mais escura pra aba inativa (contraste calculado por luminância).

**Requisitos no `~/.config/kitty/kitty.conf`** (ver `config/kitty/kitty.conf`):

```
allow_remote_control yes
listen_on unix:/tmp/kitty-{kitty_pid}
```

Precisa reiniciar o kitty (fechar e abrir) pra pegar — reload de config não é suficiente.

**Configuração no `~/.claude/settings.json`:**

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "~/.claude/hooks/kitty-tab-hook.sh" }] }
    ],
    "PostToolUse": [
      { "hooks": [{ "type": "command", "command": "~/.claude/hooks/kitty-tab-hook.sh" }] }
    ],
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "~/.claude/hooks/kitty-tab-hook.sh" }] }
    ],
    "Notification": [
      { "hooks": [{ "type": "command", "command": "~/.claude/hooks/kitty-tab-hook.sh" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "~/.claude/hooks/kitty-tab-hook.sh" }] }
    ],
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "~/.claude/hooks/kitty-tab-hook.sh" }] }
    ],
    "SessionEnd": [
      { "hooks": [{ "type": "command", "command": "~/.claude/hooks/kitty-tab-hook.sh" }] }
    ]
  }
}
```

Copie o script para `~/.claude/hooks/kitty-tab-hook.sh` e dê `chmod +x`.
