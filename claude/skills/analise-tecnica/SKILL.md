---
name: analise-tecnica
description: Gera análise técnica concisa das alterações da branch atual em relação à branch homologacao. Para cada arquivo modificado, exibe nome, tipo de operação (Modificação/Criação/Exclusão) e descrição breve da mudança. Use quando o usuário pedir análise técnica, resumo das mudanças, ou invocar /analise-tecnica.
model: haiku
---

# Análise Técnica

## Processo

1. Executar diff entre a branch atual e `homologacao`:
   ```bash
   git diff homologacao...HEAD --name-status
   git diff homologacao...HEAD
   ```

2. Para cada arquivo alterado, classificar:
   - `M` → **(Modificação)**
   - `A` → **(Criação)**
   - `D` → **(Exclusão)**
   - `R` → **(Renomeação)**

3. Ler o diff de cada arquivo e escrever uma linha concisa descrevendo **o que mudou funcionalmente** — não o que o código faz, mas o que foi adicionado/removido/alterado.

## Formato de saída

```
nome-do-arquivo.ext (Modificação): descrição breve da alteração.
outro-arquivo.html (Criação): descrição breve do que foi criado.
arquivo-removido.ts (Exclusão): descrição do que foi removido.
```

## Regras

- Uma linha por arquivo
- Sem introdução, sem conclusão, sem headers
- Descrever a **mudança**, não o comportamento geral do arquivo
- Usar o nome do arquivo sem o path completo
- Manter em português
