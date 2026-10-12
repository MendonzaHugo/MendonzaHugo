# Task Manager

Gerenciador pessoal de tarefas com Kanban, recorrência, integração com Google Agenda e Gmail,
lembretes por push, e-mail e WhatsApp, e relatórios de produtividade — hospedado gratuitamente na Cloudflare.

- Arquitetura: [docs/ARQUITETURA.md](docs/ARQUITETURA.md)
- Configuração e publicação: [docs/SETUP.md](docs/SETUP.md)

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `apps/web` | Frontend React + Vite (PWA) |
| `apps/api` | API Hono no Cloudflare Workers, banco D1 (Drizzle) e migrações |
| `packages/shared` | Tipos, esquemas e utilitários usados pelos dois lados |

## Comandos

```bash
pnpm install
pnpm dev          # app em http://localhost:5173 (API em :8787)
pnpm test         # testes
pnpm typecheck    # tipagem
pnpm check        # lint e formatação
pnpm run deploy   # publica na Cloudflare
```

## Andamento

- [x] Fase 1 — Fundação: monorepo, CI, banco e migrações, login Google com lista de permissão, PWA
- [ ] Fase 2 — Núcleo: tarefas, Kanban com arrastar e soltar, captura rápida, sincronização
- [ ] Fase 3 — Tempo: Hoje/Semana/Mês, recorrência, cronômetro
- [ ] Fase 4 — Integrações e lembretes: Google Agenda, Gmail, push, e-mail, WhatsApp
- [ ] Fase 5 — Relatórios
- [ ] Fase 6 — Refinamento
