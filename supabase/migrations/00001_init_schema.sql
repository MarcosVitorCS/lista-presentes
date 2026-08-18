-- =========================================================
-- 00001_init_schema.sql — Lista de Presentes (Rafaely & Vitor)
--
-- Contém apenas: schema, functions, triggers, view pública, RLS e grants.
-- Nenhum dado é inserido aqui — ver supabase/seed/001_bootstrap.sql para o
-- bootstrap manual do primeiro admin/evento.
--
-- Princípios de segurança aplicados neste arquivo:
--   - RLS habilitado em toda tabela de domínio.
--   - GRANT/REVOKE explícitos por tabela/coluna/função (defesa em profundidade
--     além do RLS — nunca depender só de "não existe policy" para barrar algo).
--   - quantity_reserved só é alterado por funções SECURITY DEFINER; nenhum
--     papel de cliente (anon/authenticated) recebe GRANT de UPDATE nessa coluna.
--   - Toda função SECURITY DEFINER usa `set search_path = ''` e referencia
--     tudo com schema explícito (public./auth.), evitando search_path/object
--     shadowing. Autorização é sempre checada dentro da função, nunca confiada
--     via parâmetro vindo do cliente (event_id nunca é parâmetro de RPC).
-- =========================================================


-- ---------------------------------------------------------
-- 1. TABELAS
-- ---------------------------------------------------------

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  event_date      date,
  description     text,
  pix_key         text,
  pix_key_type    text check (pix_key_type in ('cpf','cnpj','email','phone','random')),
  pix_owner_name  text,
  pix_qr_code_url text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.events is
  'Um evento (casal). MVP tem uma única linha; multi-evento é suportado pelo modelo, não pela UI.';

create table public.admin_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  created_at timestamptz not null default now()
);
comment on table public.admin_profiles is
  'Espelha auth.users. Populada automaticamente pela trigger handle_new_admin_user.';

create table public.event_admins (
  event_id   uuid not null references public.events(id) on delete cascade,
  admin_id   uuid not null references public.admin_profiles(id) on delete cascade,
  role       text not null default 'owner' check (role in ('owner','editor')),
  created_at timestamptz not null default now(),
  primary key (event_id, admin_id)
);
comment on table public.event_admins is
  'Vínculo admin<->evento. Join table para permitir multi-evento/multi-admin no futuro sem migração de schema.';

create table public.gift_lists (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  slug        text not null,
  type        text not null check (type in ('physical','quota')),
  name        text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (event_id, slug)
);

create table public.gift_items (
  id                 uuid primary key default gen_random_uuid(),
  list_id            uuid not null references public.gift_lists(id) on delete cascade,
  event_id           uuid not null references public.events(id), -- denormalizado (trigger)
  name               text not null,
  description        text,
  image_url          text,
  unit_price         numeric(10,2) check (unit_price is null or unit_price > 0),
  quantity_total     integer not null check (quantity_total > 0),
  quantity_reserved  integer not null default 0 check (quantity_reserved >= 0),
  quantity_available integer generated always as (quantity_total - quantity_reserved) stored,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint quantity_reserved_le_total check (quantity_reserved <= quantity_total)
);
comment on constraint quantity_reserved_le_total on public.gift_items is
  'Barreira final anti-overselling. Também impede reduzir quantity_total abaixo de '
  'quantity_reserved: qualquer UPDATE que viole essa relação é rejeitado pelo Postgres, '
  'independente da lógica de aplicação.';
comment on column public.gift_items.quantity_reserved is
  'Só é alterada por create_reservation/cancel_reservation (SECURITY DEFINER). Nenhum GRANT de '
  'UPDATE nesta coluna existe para anon/authenticated — ver seção de GRANTs mais abaixo.';

create table public.guests (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  name         text not null check (char_length(btrim(name)) > 0),
  contact      text not null check (char_length(btrim(contact)) > 0),
  contact_type text not null check (contact_type in ('whatsapp','email')),
  created_at   timestamptz not null default now(),
  unique (event_id, contact)
);
comment on table public.guests is
  'Identificação declarativa, sem senha. Nunca é fonte de autorização — apenas atribuição de '
  'nome/contato às reservas. anon não tem SELECT/UPDATE/DELETE nesta tabela em nenhuma hipótese.';

create table public.reservations (
  id                 uuid primary key default gen_random_uuid(),
  item_id            uuid not null references public.gift_items(id) on delete restrict,
  event_id           uuid not null references public.events(id), -- denormalizado
  guest_id           uuid not null references public.guests(id) on delete restrict,
  quantity           integer not null check (quantity > 0),
  fulfillment_method text not null check (fulfillment_method in ('physical','pix')),
  declared_amount    numeric(10,2),
  status             text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  confirmed_at       timestamptz,
  confirmed_by       uuid references public.admin_profiles(id),
  cancelled_at       timestamptz,
  notes              text,
  created_at         timestamptz not null default now()
);
comment on column public.reservations.status is
  'pending: pix declarado, aguardando confirmação (JÁ ocupa estoque). confirmed: físico imediato '
  'OU pix confirmado pelo admin. cancelled: estoque liberado, linha preservada como histórico.';

create index idx_gift_items_list_id    on public.gift_items (list_id);
create index idx_gift_items_event_id   on public.gift_items (event_id);
create index idx_reservations_item_id  on public.reservations (item_id);
create index idx_reservations_event_id on public.reservations (event_id);
create index idx_reservations_guest_id on public.reservations (guest_id);
create index idx_reservations_status   on public.reservations (status);
create index idx_guests_event_id       on public.guests (event_id);


-- ---------------------------------------------------------
-- 2. TRIGGERS
-- ---------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_events_updated_at     before update on public.events     for each row execute function public.set_updated_at();
create trigger trg_gift_lists_updated_at before update on public.gift_lists for each row execute function public.set_updated_at();
create trigger trg_gift_items_updated_at before update on public.gift_items for each row execute function public.set_updated_at();


create or replace function public.set_gift_item_event_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select gl.event_id into new.event_id from public.gift_lists gl where gl.id = new.list_id;
  if new.event_id is null then
    raise exception 'invalid_list_id';
  end if;
  return new;
end;
$$;

create trigger trg_gift_items_set_event_id
  before insert or update of list_id on public.gift_items
  for each row execute function public.set_gift_item_event_id();
comment on trigger trg_gift_items_set_event_id on public.gift_items is
  'event_id sempre derivado no servidor a partir de list_id — nunca aceito do cliente. '
  'Esta trigger é DELIBERADAMENTE NÃO security definer: ela roda com o privilégio de quem faz '
  'o INSERT/UPDATE (o admin autenticado), e a leitura de gift_lists que ela faz é coberta pelas '
  'policies de SELECT existentes (pública ou de event_admins). A checagem final de autorização '
  '"este item pertence a um evento que eu administro?" acontece no WITH CHECK da policy '
  'gift_items_admin_write, avaliado DEPOIS que esta trigger já preencheu event_id — por isso '
  'associar um item a uma lista de outro evento é barrado ali, não aqui. Não tornar esta função '
  'SECURITY DEFINER: isso enfraqueceria essa checagem.';


create or replace function public.handle_new_admin_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin_user();
comment on function public.handle_new_admin_user is
  'SECURITY DEFINER necessário: authenticated não tem INSERT em admin_profiles por padrão. '
  'search_path fixo e referências totalmente qualificadas evitam object shadowing.';


-- ---------------------------------------------------------
-- 3. VIEW PÚBLICA RESTRITA DO CATÁLOGO
-- ---------------------------------------------------------

-- Sem security_invoker: roda com os privilégios do owner da view (dono de gift_items,
-- portanto isento de RLS por ser table owner). O filtro de segurança é o WHERE abaixo —
-- não RLS pass-through. anon não tem SELECT na tabela base gift_items; só enxerga estes
-- dados por aqui.
create view public.gift_items_public as
select
  id,
  list_id,
  event_id,
  name,
  description,
  image_url,
  unit_price,
  quantity_available,
  is_active
from public.gift_items
where is_active = true;

comment on view public.gift_items_public is
  'View pública e restrita do catálogo: sem quantity_total/quantity_reserved brutos, sem dados '
  'administrativos ou de reserva. Colunas expostas: id, list_id, event_id, name, description, '
  'image_url, unit_price, quantity_available, is_active.';

-- Views de SELECT simples sobre uma única tabela são "auto-atualizáveis" no Postgres.
-- Sem este REVOKE explícito, um GRANT default do Supabase (ALTER DEFAULT PRIVILEGES,
-- aplicado a qualquer relação nova no schema public) poderia permitir UPDATE/INSERT/DELETE
-- nesta view, que o Postgres traduziria automaticamente em escrita na tabela base rodando
-- com o privilégio do OWNER da view — ou seja, um bypass completo de RLS e dos GRANTs de
-- coluna da tabela base. Por isso este REVOKE é explícito e não opcional.
revoke all on public.gift_items_public from public, anon, authenticated;
grant select on public.gift_items_public to anon, authenticated;


-- ---------------------------------------------------------
-- 4. RPCs (SECURITY DEFINER)
-- ---------------------------------------------------------

-- identify_guest: único ponto de escrita em guests. Evento resolvido por slug — nunca por
-- id do cliente. Não requer autorização: qualquer visitante pode se identificar.
create or replace function public.identify_guest(
  p_event_slug   text,
  p_name         text,
  p_contact      text,
  p_contact_type text
) returns public.guests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_guest    public.guests;
  v_name     text := btrim(p_name);
  v_contact  text := lower(btrim(p_contact));
begin
  if v_name = '' or char_length(v_name) > 120 then
    raise exception 'invalid_name';
  end if;
  if v_contact = '' or char_length(v_contact) > 160 then
    raise exception 'invalid_contact';
  end if;
  if p_contact_type not in ('whatsapp','email') then
    raise exception 'invalid_contact_type';
  end if;

  select id into v_event_id from public.events where slug = p_event_slug and is_active = true;
  if v_event_id is null then
    raise exception 'event_not_found';
  end if;

  insert into public.guests (event_id, name, contact, contact_type)
  values (v_event_id, v_name, v_contact, p_contact_type)
  on conflict (event_id, contact)
  do update set name = excluded.name, contact_type = excluded.contact_type
  returning * into v_guest;

  return v_guest;
end;
$$;
revoke all on function public.identify_guest(text, text, text, text) from public;
grant execute on function public.identify_guest(text, text, text, text) to anon, authenticated;


-- create_reservation: único ponto de escrita em reservations para convidados.
-- Reserva atômica; pix nasce pending mas JÁ ocupa estoque; físico nasce confirmed.
create or replace function public.create_reservation(
  p_item_id            uuid,
  p_guest_id           uuid,
  p_quantity           integer,
  p_fulfillment_method text
) returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_list_type   text;
  v_list_active boolean;
  v_item_event  uuid;
  v_guest_event uuid;
  v_item        public.gift_items%rowtype;
  v_status      text;
  v_amount      numeric(10,2);
  v_reservation public.reservations%rowtype;
begin
  -- 1) validação de entrada pura (sem tocar no banco)
  if p_item_id is null or p_guest_id is null then
    raise exception 'missing_parameters';
  end if;
  if p_quantity is null or p_quantity <= 0 or p_quantity > 100000 then
    raise exception 'invalid_quantity';
  end if;
  if p_fulfillment_method not in ('physical','pix') then
    raise exception 'invalid_fulfillment_method';
  end if;

  -- 2) guest -> event (nunca aceito do cliente, sempre lido daqui)
  select event_id into v_guest_event from public.guests where id = p_guest_id;
  if v_guest_event is null then
    raise exception 'guest_not_found';
  end if;

  -- 3) item -> event/list, num único select (existência, ativo, tipo da lista)
  select gi.event_id, gl.type, gl.is_active
    into v_item_event, v_list_type, v_list_active
  from public.gift_items gi
  join public.gift_lists gl on gl.id = gi.list_id
  where gi.id = p_item_id;

  if v_item_event is null then
    raise exception 'item_not_found';
  end if;
  if not v_list_active then
    raise exception 'list_inactive';
  end if;

  -- 4) guest e item precisam pertencer ao MESMO evento (event_id nunca vem do cliente)
  if v_item_event <> v_guest_event then
    raise exception 'guest_event_mismatch';
  end if;

  -- 5) cota só aceita pix; item físico aceita physical ou pix (já validado no passo 1)
  if v_list_type = 'quota' and p_fulfillment_method <> 'pix' then
    raise exception 'invalid_fulfillment_method_for_list';
  end if;

  -- 6) passo atômico: só avança se o item estiver ativo e sobrar estoque suficiente.
  --    O lock de linha do UPDATE é o que torna isso seguro contra corrida — duas chamadas
  --    concorrentes serializam aqui; a segunda reavalia o WHERE com o valor já atualizado.
  update public.gift_items
     set quantity_reserved = quantity_reserved + p_quantity
   where id = p_item_id
     and is_active = true
     and quantity_reserved + p_quantity <= quantity_total
  returning * into v_item;

  if not found then
    raise exception 'insufficient_stock';
  end if;

  -- 7) declared_amount é SEMPRE calculado aqui — não existe parâmetro p_declared_amount
  --    nesta assinatura, o cliente nunca fornece esse valor.
  if p_fulfillment_method = 'pix' then
    if v_item.unit_price is null then
      raise exception 'item_missing_price';
    end if;
    v_status := 'pending';    -- estoque já foi ocupado no passo 6, mesmo pendente
    v_amount := p_quantity * v_item.unit_price;
  else
    v_status := 'confirmed';  -- físico: sem pagamento pela plataforma
    v_amount := null;
  end if;

  -- invariante: v_item.event_id = v_guest_event = v_item_event (checado no passo 4)
  insert into public.reservations (
    item_id, event_id, guest_id, quantity, fulfillment_method, declared_amount, status
  ) values (
    v_item.id, v_item.event_id, p_guest_id, p_quantity, p_fulfillment_method, v_amount, v_status
  )
  returning * into v_reservation;

  return v_reservation;
end;
$$;
revoke all on function public.create_reservation(uuid, uuid, integer, text) from public;
grant execute on function public.create_reservation(uuid, uuid, integer, text) to anon, authenticated;

comment on function public.create_reservation is
  'Único ponto de escrita em reservations para convidados. event_id nunca é parâmetro — sempre '
  'derivado de guests/gift_items no servidor. declared_amount sempre calculado aqui. Incremento '
  'de quantity_reserved é atômico via UPDATE condicional (passo 6 no corpo da função).';


-- confirm_reservation (admin): pending+pix -> confirmed. NUNCA toca quantity_reserved.
create or replace function public.confirm_reservation(p_reservation_id uuid)
returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.reservations%rowtype;
begin
  if p_reservation_id is null then
    raise exception 'missing_parameters';
  end if;

  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'reservation_not_found';
  end if;

  -- autorização checada AQUI dentro, nunca confiando em parâmetro de evento vindo do cliente
  if not exists (
    select 1 from public.event_admins
    where admin_id = auth.uid() and event_id = v_reservation.event_id
  ) then
    raise exception 'not_authorized';
  end if;

  if v_reservation.fulfillment_method <> 'pix' or v_reservation.status <> 'pending' then
    raise exception 'invalid_state';
  end if;

  update public.reservations
     set status = 'confirmed', confirmed_at = now(), confirmed_by = auth.uid()
   where id = p_reservation_id
  returning * into v_reservation;

  return v_reservation;
end;
$$;
revoke all on function public.confirm_reservation(uuid) from public;
grant execute on function public.confirm_reservation(uuid) to authenticated;


-- cancel_reservation (admin): libera estoque atomicamente e marca cancelled.
create or replace function public.cancel_reservation(p_reservation_id uuid)
returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.reservations%rowtype;
  v_updated     public.gift_items%rowtype;
begin
  if p_reservation_id is null then
    raise exception 'missing_parameters';
  end if;

  select * into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update; -- trava a linha: impede cancelamento duplicado concorrente

  if not found then
    raise exception 'reservation_not_found';
  end if;

  if not exists (
    select 1 from public.event_admins
    where admin_id = auth.uid() and event_id = v_reservation.event_id
  ) then
    raise exception 'not_authorized';
  end if;

  if v_reservation.status = 'cancelled' then
    raise exception 'already_cancelled';
  end if;

  -- libera exatamente a quantidade reservada; o WHERE >= é uma segunda barreira contra
  -- quantity_reserved negativo mesmo em cenário anômalo
  update public.gift_items
     set quantity_reserved = quantity_reserved - v_reservation.quantity
   where id = v_reservation.item_id
     and quantity_reserved >= v_reservation.quantity
  returning * into v_updated;

  if not found then
    raise exception 'stock_inconsistency';
  end if;

  update public.reservations
     set status = 'cancelled', cancelled_at = now()
   where id = p_reservation_id
  returning * into v_reservation;

  return v_reservation; -- linha preservada: histórico nunca é apagado
end;
$$;
revoke all on function public.cancel_reservation(uuid) from public;
grant execute on function public.cancel_reservation(uuid) to authenticated;


-- ---------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------

alter table public.events         enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.event_admins   enable row level security;
alter table public.gift_lists     enable row level security;
alter table public.gift_items     enable row level security;
alter table public.guests         enable row level security;
alter table public.reservations   enable row level security;

-- events: leitura pública de eventos ativos + leitura própria do admin (mesmo inativo) + escrita
-- restrita a event_admins. Sem policy de INSERT: criação de evento é bootstrap fora do app.
create policy events_public_read on public.events
  for select to anon, authenticated using (is_active = true);

create policy events_admin_read on public.events
  for select to authenticated
  using (exists (select 1 from public.event_admins ea where ea.event_id = events.id and ea.admin_id = auth.uid()));
comment on policy events_admin_read on public.events is
  'Permite que o admin veja o próprio evento mesmo com is_active = false — a policy pública '
  'só cobre eventos ativos.';

create policy events_admin_write on public.events
  for update to authenticated
  using (exists (select 1 from public.event_admins ea where ea.event_id = events.id and ea.admin_id = auth.uid()))
  with check (exists (select 1 from public.event_admins ea where ea.event_id = events.id and ea.admin_id = auth.uid()));

-- gift_lists
create policy gift_lists_public_read on public.gift_lists
  for select to anon, authenticated using (is_active = true);

create policy gift_lists_admin_write on public.gift_lists
  for all to authenticated
  using (exists (select 1 from public.event_admins ea where ea.event_id = gift_lists.event_id and ea.admin_id = auth.uid()))
  with check (exists (select 1 from public.event_admins ea where ea.event_id = gift_lists.event_id and ea.admin_id = auth.uid()));

-- gift_items: policy pública existe por defesa em profundidade (caso um grant futuro reabra
-- SELECT para anon na tabela base por engano) — hoje anon não tem GRANT nenhum aqui, só na
-- view gift_items_public.
create policy gift_items_public_read on public.gift_items
  for select to anon, authenticated using (is_active = true);

create policy gift_items_admin_write on public.gift_items
  for all to authenticated
  using (exists (select 1 from public.event_admins ea where ea.event_id = gift_items.event_id and ea.admin_id = auth.uid()))
  with check (exists (select 1 from public.event_admins ea where ea.event_id = gift_items.event_id and ea.admin_id = auth.uid()));

-- guests: nenhuma policy de select/insert/update/delete para anon.
create policy guests_admin_read on public.guests
  for select to authenticated
  using (exists (select 1 from public.event_admins ea where ea.event_id = guests.event_id and ea.admin_id = auth.uid()));

-- reservations: nenhum acesso para anon, nem leitura.
create policy reservations_admin_read on public.reservations
  for select to authenticated
  using (exists (select 1 from public.event_admins ea where ea.event_id = reservations.event_id and ea.admin_id = auth.uid()));

-- admin_profiles / event_admins: cada admin só enxerga a própria linha
create policy admin_profiles_self_read on public.admin_profiles
  for select to authenticated using (id = auth.uid());

create policy event_admins_self_read on public.event_admins
  for select to authenticated using (admin_id = auth.uid());


-- ---------------------------------------------------------
-- 6. GRANT / REVOKE (defesa em profundidade além do RLS)
-- ---------------------------------------------------------

-- Reset amplo: nenhum INSERT/UPDATE/DELETE direto por padrão para os dois papéis públicos.
revoke insert, update, delete on
  public.events, public.gift_lists, public.gift_items,
  public.guests, public.reservations,
  public.admin_profiles, public.event_admins
from anon, authenticated;

-- anon nunca lê dados sensíveis, mesmo que uma policy futura seja mal escrita.
revoke select on public.guests, public.reservations, public.admin_profiles, public.event_admins from anon;

-- Catálogo público sem coluna sensível: leitura direta liberada.
grant select on public.events, public.gift_lists to anon, authenticated;

-- gift_items: anon NÃO lê a tabela base — só a view restrita (seção 3).
revoke select on public.gift_items from anon;
grant select on public.gift_items to authenticated;

-- Leitura restrita a autenticados (RLS filtra por event_admins)
grant select on public.guests, public.reservations, public.admin_profiles, public.event_admins to authenticated;

-- CRUD de catálogo pelo admin (RLS filtra por event_admins).
-- events: só UPDATE — não existe policy de INSERT (criação de evento é bootstrap-only), então
-- o grant não inclui insert (evita grant "morto" que dependeria só do RLS pra ser barrado).
grant update on public.events to authenticated;
grant insert, update on public.gift_lists to authenticated;

-- quantity_reserved é OMITIDO das listas de colunas abaixo: mesmo autorizado a editar o item,
-- o admin não recebe privilégio de coluna para alterá-la — só as RPCs (rodando como owner da
-- função) tocam esse campo.
grant insert (list_id, name, description, image_url, unit_price, quantity_total, is_active) on public.gift_items to authenticated;
grant update (name, description, image_url, unit_price, quantity_total, is_active) on public.gift_items to authenticated;

-- guests e reservations: nenhum GRANT de insert/update para anon/authenticated — toda escrita
-- passa pelas RPCs SECURITY DEFINER (identify_guest, create_reservation, confirm_reservation,
-- cancel_reservation), que rodam com o privilégio do owner da função, não do caller.
