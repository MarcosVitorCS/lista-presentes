-- =========================================================
-- 00005_social_links_and_hero_label.sql
--
-- Duas colunas novas em events, aditivas, sem tocar em nenhuma tabela/RPC
-- existente:
--
-- 1) Redes sociais (opcional) exibidas no rodapé público.
-- 2) hero_label: hoje "Casamento" está fixo no código do hero. Vira
--    configurável para a plataforma comportar outros tipos de evento no
--    futuro (aniversário, formatura, etc.) sem precisar editar código.
-- =========================================================

alter table public.events
  add column instagram_url text,
  add column facebook_url text,
  add column youtube_url text,
  add column whatsapp_url text,
  add column hero_label text not null default 'Casamento';

comment on column public.events.hero_label is
  'Rótulo mostrado acima do nome no hero (ex.: "Casamento", "Aniversário de 15 anos"). Editável em /admin/dashboard/configuracoes.';
comment on column public.events.whatsapp_url is
  'Link de contato/grupo do WhatsApp do evento — diferente do WhatsApp que o convidado informa ao se identificar (guests.contact).';
