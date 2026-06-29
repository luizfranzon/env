---
name: commit-message
description: Analyzes staged git changes and generates 5 commit message suggestions following the project's PT-BR convention. Use when the user wants commit message suggestions, asks "what should I write in the commit", invokes /commit-message, or has staged changes ready to commit.
model: haiku
disable-model-invocation: true
---

# Commit Message

## Quick start

1. Run `git diff --staged` to read the staged changes
2. Run `git branch --show-current` to extract the ticket number from the branch name (pattern: `t#####`)
3. Run `git log --oneline -10` to calibrate tone and granularity against recent commits
4. Generate exactly **5 suggestions** following the convention below

## Convention

```
#TICKET - Verbo Descrição concisa no imperativo
```

**Preferred verbs (PT-BR imperative):**

| Verb      | When to use                                          |
|-----------|------------------------------------------------------|
| Adiciona  | New file, component, feature, field, or behavior     |
| Corrige   | Bug fix, broken behavior, wrong value                |
| Atualiza  | Existing logic changed, dependency bumped            |
| Remove    | Deletion of dead code, file, import, or feature      |
| Cria      | New module, service, or significant abstraction      |
| Altera    | Visual or structural change without new behavior     |
| Refatora  | Internal restructure with no observable change       |
| Melhora   | Performance, readability, or UX improvement          |

**Rules:**
- Always prefix with the ticket number extracted from the branch (`t35406` → `#35406`)
- If ticket cannot be determined, omit the prefix
- Description in PT-BR, no trailing period
- No "WIP", "Correções" alone, or vague English ("Fix", "Update")
- Keep under 72 characters total
- **Describe the business rule / user-facing action**, not the technical detail. Before writing, ask: "qual ação do usuário essa mudança afeta?" — not "qual elemento foi alterado?". The message must be readable by someone who never saw the code.
  - ❌ "Oculta ícone de reordenação quando em modo de edição" (visual detail)
  - ❌ "Impede abertura do modal de busca durante edição" (technical detail)
  - ✅ "Bloqueia edição do curso do treinamento quando em modo de edição" (business rule)

## Output format

Present the 5 suggestions as a numbered list. After the list, add one line explaining which suggestion you recommend and why (scope/precision).

## Example output

```
1. #35406 - Adiciona widget de frequência interna ao painel de cargo
2. #35406 - Cria componente FrequencyWidget com suporte a dados históricos
3. #35406 - Adiciona banda de frequência interna na tela de detalhes do cargo
4. #35406 - Atualiza painel de cargo com exibição de frequência de acesso
5. #35406 - Adiciona visualização de frequência interna ao job-detail

→ Recomendação: opção 3 — descreve o contexto (banda), a funcionalidade (frequência interna) e a tela afetada.
```
