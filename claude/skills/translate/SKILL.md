---
name: translate
description: Add i18n translation keys to src/assets/i18n/ (pt.json, en.json, es.json). Use when user calls /translate with quoted phrases, e.g. /translate "Start", "Adjust volume" in the context of a music player.
model: haiku
---

# Translate

Manages the three flat JSON translation files in `src/assets/i18n/`:
- `pt.json` — Portuguese (primary)
- `en.json` — English
- `es.json` — Spanish

## Input format

```
/translate "Phrase one", "Phrase two" optional free-text context
```

- **Quoted strings** → each one is a translation candidate to be processed and added
- **Unquoted text** → additional context to ensure translations fit the domain (e.g. "in the context of a music player")

## Workflow — step by step

For each quoted phrase:

1. **Detect language** — identify whether the phrase is in PT, EN, or ES
2. **Spell/grammar check** — if there are errors, correct them and explicitly tell the user what was changed before proceeding (e.g. `"AJustar volume" → "Ajustar volume" (capitalização corrigida)`)
3. **Generate key** — derive a snake_case key from the **English** translation of the phrase (e.g. `"Ajustar volume"` → `adjust_volume`)
   - Key must always be in English snake_case regardless of the input language
   - Check existing keys with grep before creating — warn if similar key already exists
4. **Translate** — produce PT, EN, ES values using the provided context to pick domain-appropriate wording
5. **Insert** — add the key to all three JSON files at the correct alphabetical position

After processing all phrases, show a summary table before writing:

| Key | PT | EN | ES |
|-----|----|----|-----|
| `ajustar_volume` | Ajustar volume | Adjust volume | Ajustar volumen |

Ask for confirmation if any correction was made or if a similar key was found. Otherwise insert directly.

## Key format rules

- snake_case, no accents, all lowercase
- Alphabetical order must be preserved in all three files
- Template variables use `{{varName}}` syntax when needed
- Never add a key to fewer than all three files

## Audit workflow (find missing keys)

Run to find keys in pt but missing from en or es:

```bash
node -e "
const pt = Object.keys(require('./src/assets/i18n/pt.json'));
const en = Object.keys(require('./src/assets/i18n/en.json'));
const es = Object.keys(require('./src/assets/i18n/es.json'));
console.log('Missing EN:', pt.filter(k => !en.includes(k)));
console.log('Missing ES:', pt.filter(k => !es.includes(k)));
"
```

## Usage in code

```html
{{ 'key_name' | translate }}
{{ 'add_x_participants' | translate: { qtd: count } }}
```

```typescript
this.translate.instant('key_name')
this.translate.instant('add_x_participants', { qtd: count })
```




