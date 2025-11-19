# GestionaPro

Estado y guía rápida
--------------------

Este repositorio contiene una aplicación Next.js en `src/` y funciones de Firebase en `functions/`.

Requisitos locales
------------------

- Node.js >= 20
- npm (o pnpm si decides migrar)
- `gh` CLI (opcional, para crear secrets en GitHub)

Instalación y desarrollo
------------------------

1. Instalar dependencias:

```bash
npm install
```

2. Preparar hooks (Husky):

```bash
npm run prepare
```

3. Levantar en modo desarrollo:

```bash
npm run dev
```

Tests
-----

```bash
npm run test
```

Despliegue automático a Vercel (CI)
---------------------------------

Este repo incluye un workflow GitHub Actions (`.github/workflows/ci.yml`) que:
- corre lint, typecheck, tests y build
- despliega a Vercel cuando se hace push a `main` y los secrets de Vercel están configurados

Secrets necesarios en GitHub (Settings → Secrets and variables → Actions):
- `VERCEL_TOKEN` — token de tu cuenta Vercel (Personal Token)
- `VERCEL_ORG_ID` — ID de la organización en Vercel
- `VERCEL_PROJECT_ID` — ID del proyecto en Vercel

Cómo añadir los secrets (manual):

1. Obtén `VERCEL_TOKEN` desde tu panel de Vercel (Account → Tokens → Create).
2. En el dashboard del proyecto en Vercel, copia `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`.
3. Ve a GitHub → Settings → Secrets and variables → Actions → New repository secret y crea los 3 secrets.

O bien, usando la GitHub CLI (`gh`) puedes ejecutar desde tu máquina local:

```bash
export VERCEL_TOKEN="<token>"
export VERCEL_ORG_ID="<org-id>"
export VERCEL_PROJECT_ID="<project-id>"
./scripts/set-github-secrets.sh owner/repo
```

Notas
-----

- No incluyas tus claves privadas en el repo. Usa `.env.local` (añade a `.gitignore`).
- Para desplegar manualmente con Vercel CLI usa `vercel` desde la raíz (requiere `npm i -g vercel`).
