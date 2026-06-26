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
