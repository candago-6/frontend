# Procon de Jacareí — Painel Web

Painel administrativo (Next.js) do assistente virtual de WhatsApp do Procon de Jacareí. Usado pela equipe interna para gerenciar usuários do sistema, acompanhar conversas e métricas de atendimento do bot.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (`@base-ui/react`)
- **TanStack Query v5** — cache/estado de dados remotos
- **Zustand** (`persist`) — estado global de autenticação
- **React Hook Form + Zod v4** — formulários e validação
- **Sonner** — toasts de feedback
- **Axios** — cliente HTTP

## Pré-requisitos

- Node.js 20+
- Backend `service_manager` rodando (porta `8002` por padrão) — repo [`candago-6/backend`](https://github.com/candago-6/backend)

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Outros comandos

```bash
npm run build   # build de produção
npm run start   # serve o build de produção
npm run lint    # ESLint
```

## Variáveis de ambiente

Crie um `.env.local` na raiz (não versionado) se precisar customizar:

| Variável | Default | Descrição |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8002` | Base URL da API do `service_manager` |
| `NEXT_PUBLIC_MOCK_AUTH` | _(ausente)_ | Se `"true"`, login e CRUD de usuários usam dados mockados em memória — útil pra desenvolver sem backend. **Requer restart do `next dev`** (variável `NEXT_PUBLIC_*` é embutida no build). Deixe ausente/`false` para usar o backend real. |

## Login de desenvolvimento (backend real)

Usuário admin seedado pelo `service_manager` na primeira execução:

```
email: admin@procon.sp.gov.br
senha: admin123
```

(configurável via `ADMIN_EMAIL`/`ADMIN_PASSWORD` no backend)

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/login/      # Tela de login (route group, sem layout do dashboard)
│   └── dashboard/
│       ├── layout.tsx     # Sidebar + navegação + logout
│       ├── page.tsx       # Redireciona para /dashboard/usuarios
│       └── usuarios/      # CRUD de usuários do sistema (cargos)
├── components/ui/         # Componentes shadcn/ui
├── lib/                    # Providers (TanStack Query, Toaster), utils
├── services/               # Camada de acesso à API (auth, users)
├── store/                  # Zustand (auth: token + user, persistido)
└── types/                  # Tipos compartilhados (User, Role, etc.)
```

Path alias: `@/*` → `src/*`.

## Autenticação

- `POST /auth/login` retorna `{ token, user }`. Token JWT (8h) é guardado no Zustand store persistido (`localStorage["auth-storage"]`).
- `src/services/api.ts` injeta `Authorization: Bearer <token>` em toda requisição via interceptor do Axios.
- Resposta `401` limpa a sessão (`logout()`) e redireciona para `/login`.

## Cargos (Roles)

O CRUD em `/dashboard/usuarios` gerencia contas de acesso ao painel, com 3 cargos:

| Role | Descrição |
|---|---|
| `gestor_gerencia` | Gestão geral |
| `gestor_analista` | Gestão de analistas |
| `analista` | Atendimento/análise |

> **Atenção**: `/api/v1/admin-users` (este CRUD) é diferente de `/api/v1/users` do backend, que se refere aos **clientes/contatos do WhatsApp** (outro domínio, com CPF criptografado). Não confundir os dois.

## Branches

- `main` — branch principal, sempre deployável
- `feature/*` — uma branch por issue/feature, PR para `main`

## Backend

API consumida: [`candago-6/backend`](https://github.com/candago-6/backend) — serviço `service_manager` (FastAPI), porta `8002`. Veja o README desse repo para subir o backend completo via `docker compose`.
