# Referência de Migração

## Mapeamento de campos: antigo → novo

| Motor Antigo | Motor Novo |
|---|---|
| `value.item.data` | `data()` — já extraído de `payload[0].data` |
| `value.recordQuantity` | `context().recordCount` |
| `value.sessionName` | não existe no novo motor |
| `value.item.endPoint` | substituído por `moreRecordsDealer` |
| `value.isDetailed` | `context().params?.isDetailed` (se o backend enviar) |
| `value.componentToShow` | `context().identifier` |
| `value.personId` | `context().itemIds[0]` |
| `value.item.parameters?.X` | `context().params?.X` |

## Paginação

**Motor antigo** usava `IonInfiniteScroll` com GET no `endPoint`:
```typescript
doInfinite(infiniteScroll) {
  this.api.get(this.endpoint).then(result => { ... });
}
```

**Motor novo** usa o utilitário:
```typescript
// src/app/components/dynamic-form-renderer/utils/moreRecords.utils.ts
protected readonly paginationState = moreRecordsDealer(this.data, this.context);
// retorna: { slicedList, showOpenModalButton, hasMoreRecords }
```

Se houver mais registros, abrir modal que faz request passando `context()`.

## Template do arquivo .types.ts

```typescript
export interface XxxPayload {
  values?: XxxItem[];
  hasMoreRecords?: boolean;
  recordsCount?: number;
  sharedValues?: Record<string, unknown>;
}

export interface XxxItem {
  // campos reais do payload[0].data do motor novo
  // verificar inspecionando a request POST /auth/widget/F/data/{id}
}
```

## Imports padrão do componente novo

```typescript
import {
  ChangeDetectionStrategy, Component, computed, input
} from '@angular/core';
import {
  WidgetBase, WidgetContext, WidgetPlugin
} from '@components/dynamic-form-renderer/types/dynamic-form-renderer-payload.types';
import { moreRecordsDealer } from '@components/dynamic-form-renderer/utils/moreRecords.utils';
```

## Arquivos que precisam ser editados no registro

1. `src/app/components/dynamic-form-renderer/ui/widget-renderer/widgets/curriculum/curriculum-widgets-registry.enum.ts`
2. `src/app/components/dynamic-form-renderer/ui/widget-renderer/widget-renderer.registry.ts`

O `widgets-registry.enum.ts` já faz merge automático via spread:
```typescript
export const WidgetsRegistryEnum = {
  ...CommonWidgetsEnum,
  ...JobDescriptionWidgetsEnum,
  ...CurriculumWidgetsEnum,  // ← já incluído
} as const;
```

## Diferença de shape a verificar

O shape dos dados entre os motores pode mudar. Se a banda antiga ler `value.item.data.someField` mas o campo não existir no payload novo, verificar o formato real inspecionando a request no browser ou no HAR de referência em `examples/new-response.har`.

Regra geral:
- Arrays simples viram `{ values: [...], hasMoreRecords, recordsCount }`
- Objetos simples geralmente mantêm o mesmo shape
- Campos de texto internacionalizados viram arrays `[{ language, translatedLabel }]`
