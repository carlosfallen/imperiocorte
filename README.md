# Império Corte - Plataforma de Agendamento

Sistema completo de agendamento para salão de beleza desenvolvido com Astro, SolidJS e Cloudflare.

## Tecnologias

- **Frontend**: Astro + SolidJS
- **Backend**: Astro API Routes / Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Deploy**: Cloudflare Pages

## Estrutura do Projeto
```
imperio-corte/
├── src/
│   ├── components/       # Componentes SolidJS e Astro
│   ├── layouts/          # Layouts base
│   ├── lib/              # Utilitários, DB, auth, scheduling
│   ├── pages/            # Páginas e API routes
│   └── middleware.ts     # Middleware de autenticação
├── migrations/           # SQL schemas
├── astro.config.mjs
├── wrangler.toml
└── package.json
```

## Setup e Deploy

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar Database D1
```bash
wrangler d1 create imperio-corte-db
```

Copie o `database_id` gerado e atualize em `wrangler.toml`.

### 3. Criar Bucket R2
```bash
wrangler r2 bucket create imperio-corte-media
```

### 4. Rodar migrations
```bash
npm run db:migrate
```

### 5. Development
```bash
npm run dev
```

### 6. Deploy
```bash
npm run deploy
```

## Configuração

Edite `wrangler.toml` para:
- Atualizar `database_id` do D1
- Configurar `JWT_SECRET` (usar valor seguro em produção)
- Atualizar `WHATSAPP_NUMBER`

## Funcionalidades

- ✅ Landing page premium com conversão
- ✅ Catálogo completo de serviços
- ✅ Fluxo de agendamento multi-step
- ✅ Tracking de origem (Instagram, Google, etc.)
- ✅ Sistema de autenticação
- ✅ Área do cliente
- ✅ Admin panel completo
- ✅ Integração WhatsApp
- ✅ Exportação ICS (calendário)
- ✅ Relatórios e analytics
- ✅ Upload de mídia para R2

## Próximos Passos

1. Implementar área do cliente completa com histórico
2. Implementar admin panel com todas as views
3. Adicionar sistema de disponibilidade de horários em tempo real
4. Implementar upload de imagens para R2
5. Adicionar sistema de notificações
6. Configurar domínio personalizado no Cloudflare Pages

## Performance

O projeto foi otimizado para atingir scores Lighthouse > 90:
- SSR/SSG com Astro
- Islands Architecture com SolidJS
- Lazy loading de imagens
- Fonts otimizadas
- CSS minificado