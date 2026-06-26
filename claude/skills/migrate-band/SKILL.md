---
name: migrate-band
description: Migra uma banda (widget) do motor antigo ComponentChooser para o motor novo DynamicFormRenderer no projeto MobileCore. Use quando o usuário escrever /migrate-band seguido do nome da banda ou identifier (ex: /migrate-band FormacaoAcademica, /migrate-band EmployeeEducationLevel).
---

# migrate-band

## Início obrigatório

Antes de qualquer coisa, leia:
1. `docs/motor-migration-guide.md` — guia completo dos dois motores
2. Um widget já migrado como referência de padrão (ex: `src/app/components/dynamic-form-renderer/ui/widget-renderer/widgets/job-description/job-employees-widget/job-employees-widget.component.ts`)

## Fluxo de migração

### 1. Localizar a banda antiga

Buscar em `src/app/components/bandas/` pelo nome ou identifier informado.

Anotar do componente antigo:
- Identifier: string em `@registerComponent([BandaIdentifiersEnum.X])`
- Campos lidos de `value.item.data` (shape dos dados)
- Se usa `value.item.endPoint` (paginação)
- Se usa `value.item.parameters?.X` (params extras)
- Imports e subcomponentes usados no template

### 2. Criar o novo widget

**Pasta:** `src/app/components/dynamic-form-renderer/ui/widget-renderer/widgets/curriculum/{identifier-kebab}-widget/`

**Arquivos:**
- `{identifier-kebab}-widget.component.ts`
- `{identifier-kebab}-widget.component.html`
- `{identifier-kebab}-widget.types.ts`

**Contrato obrigatório:**
```typescript
export class XxxWidgetComponent implements WidgetBase<XxxPayload> {
  data = input<XxxPayload | null>(null);
  context = input<WidgetContext>({});
  plugins = input<WidgetPlugin[]>([]);
}
```

Ver [REFERENCE.md](REFERENCE.md) para mapeamento de campos e padrões de paginação.

### 3. Registrar o widget

**`curriculum-widgets-registry.enum.ts`** — adicionar o identifier:
```typescript
export const CurriculumWidgetsEnum = {
  ...,
  EmployeeXxx: 'EmployeeXxx',
} as const;
```

**`widget-renderer.registry.ts`** — adicionar lazy loader na seção Curriculum Widgets:
```typescript
[WidgetsRegistryEnum.EmployeeXxx]: () =>
  import('./widgets/curriculum/employee-xxx-widget/employee-xxx-widget.component')
    .then((m) => m.EmployeeXxxWidgetComponent),
```

## Checklist de entrega

- [ ] Banda antiga lida e contrato mapeado
- [ ] `.types.ts` com tipo do payload novo
- [ ] Componente implementa `WidgetBase<T>` com os 3 inputs como signals
- [ ] Template adaptado (sem `@Input() set data`, sem `endPoint` manual)
- [ ] Identifier adicionado em `CurriculumWidgetsEnum`
- [ ] Lazy loader adicionado em `widget-renderer.registry.ts`
