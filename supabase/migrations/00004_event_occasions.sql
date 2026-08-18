-- =========================================================
-- 00004_event_occasions.sql — ocasiões do evento (Chá de Cozinha, Casamento)
--
-- Aditiva apenas: nenhum DROP, nenhum DELETE, nenhuma tabela/RPC existente é
-- alterada. `events` continua sendo o tenant (1 linha = o casal) — esta
-- migration não duplica nem reestrutura essa tabela, só acrescenta uma
-- coluna e uma tabela filha nova, no mesmo padrão de gift_lists.
-- =========================================================

alter table public.events add column image_url text;
comment on column public.events.image_url is
  'Foto principal do casal, usada no hero da landing. Opcional — a UI trata ausência com um fallback.';

create table public.event_occasions (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  -- Link opcional com a lista de presentes correspondente (pro botão "Ver
  -- lista"). Nullable de propósito: uma ocasião pode não ter lista (ex.: um
  -- jantar de boas-vindas), e uma lista pode existir sem ocasião vinculada.
  gift_list_id     uuid references public.gift_lists(id) on delete set null,
  slug             text not null,
  name             text not null,
  occasion_date    date,
  occasion_time    time,
  location_name    text,
  address          text,
  google_maps_url  text,
  description      text,
  image_url        text,
  is_active        boolean not null default true,
  display_order    integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (event_id, slug)
);
comment on table public.event_occasions is
  'Momentos do casamento (data/hora/local) — separado de gift_lists de propósito: '
  'gift_lists é catálogo de itens, event_occasions é "onde e quando". O mesmo evento '
  'pode ter N ocasiões; cada uma pode, opcionalmente, apontar pra uma gift_list.';

create index idx_event_occasions_event_id on public.event_occasions (event_id);

create trigger trg_event_occasions_updated_at
  before update on public.event_occasions
  for each row execute function public.set_updated_at(); -- reaproveita a função criada na 00001

alter table public.event_occasions enable row level security;

-- Mesmo padrão de gift_lists_public_read / gift_lists_admin_write (00001):
-- leitura pública só do que está ativo, escrita restrita a event_admins.
create policy event_occasions_public_read on public.event_occasions
  for select to anon, authenticated
  using (is_active = true);

create policy event_occasions_admin_write on public.event_occasions
  for all to authenticated
  using (exists (
    select 1 from public.event_admins ea
    where ea.event_id = event_occasions.event_id and ea.admin_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.event_admins ea
    where ea.event_id = event_occasions.event_id and ea.admin_id = auth.uid()
  ));

grant select on public.event_occasions to anon, authenticated;
grant insert, update on public.event_occasions to authenticated;
-- Sem delete, mesmo padrão de gift_lists/gift_items: desativar via is_active,
-- nunca apagar linha (mantém histórico e evita referências quebradas).
