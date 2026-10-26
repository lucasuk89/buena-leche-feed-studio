# Buena Leche Feed Studio

Protótipo funcional de um planejador visual de Instagram para múltiplos clientes.

## Funciona agora
- dashboard de clientes
- feed em 3 colunas
- upload local de imagens
- drag & drop para reorganizar
- botão "Organizar melhor layout"
- posts e carrosséis
- editor de legenda, data, hora, status e responsável
- comentários internos
- calendário
- lista de conteúdos
- undo de reorganizações/exclusões
- layout responsivo

## Rodar
```bash
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite.

## Importante
Esta versão é um MVP frontend: uploads e alterações ficam na sessão do navegador. Para colaboração real entre Lucas, Bruna, Katia e clientes, conecte Supabase (Auth + Postgres + Storage + Realtime). Para publicação direta no Instagram, adicione posteriormente a Meta/Instagram Graph API.

## Próxima arquitetura recomendada
- React + TypeScript + Vite
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Realtime
- Vercel
- Row Level Security por workspace/cliente
