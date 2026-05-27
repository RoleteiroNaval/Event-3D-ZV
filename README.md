# Image-to-3D Event Architect

Aplicativo Vite/React para transformar uma imagem de referencia + briefing de evento em um mockup 3D navegavel.

## Requisitos

- Node.js 20 ou superior
- npm
- Git

## Instalar

```powershell
git clone URL_DO_REPOSITORIO
cd "GERAÇÃO 3 D"
npm.cmd run setup
```

## Rodar em desenvolvimento

```powershell
npm.cmd run dev:local
```

Abra:

```text
http://127.0.0.1:5173
```

## Validar o projeto

```powershell
npm.cmd run check
```

Esse comando executa:

- TypeScript typecheck
- ESLint
- Build de producao

## Build de producao

```powershell
npm.cmd run build
```

O build final fica em:

```text
image-3d-navigator/dist
```

## Estrutura principal

```text
image-3d-navigator/src
├── components
│   ├── EventBriefPanel.tsx
│   └── ThreeViewer.tsx
├── lib
│   ├── aiArchitect.ts
│   ├── imagePipeline.ts
│   └── layoutGenerator.ts
├── three
│   ├── collisionSystem.ts
│   ├── createEventMockup.ts
│   ├── createImageWorld.ts
│   └── objectLibrary.ts
├── types
│   └── event.ts
└── workers
    └── depthWorker.ts
```

## Observacoes

- O projeto roda localmente no navegador.
- O aviso de `eval` no build vem de `onnxruntime-web`, dependencia usada pelo modelo local de IA.
- `node_modules` e `dist` nao devem ser enviados para o GitHub.
