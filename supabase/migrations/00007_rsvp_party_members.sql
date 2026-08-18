-- =========================================================
-- 00007_rsvp_party_members.sql — RSVP por ocasião + pessoas nominais
--
-- Evolução do módulo de RSVP criado na 00006. Duas mudanças de modelo,
-- nenhuma delas compatível com os dados anteriores (motivo detalhado em
-- cada seção abaixo), por isso a migration começa limpando o que existe
-- nas 3 tabelas de RSVP antes de restruturar. Confirmado com o cliente:
-- tudo que existe hoje em invitations/rsvp_responses/guests.max_party_size
-- é dado de teste desta mesma sessão de desenvolvimento, sem nenhum
-- convidado real ainda. gift_lists/gift_items/reservations/guests (como
-- identidade)/identify_guest/create_reservation/confirm_reservation/
-- cancel_reservation NÃO são tocados nesta migration.
--
-- 1) RSVP deixa de ser uma flag global em events e passa a ser por
--    event_occasions (events.allow_rsvp sai, event_occasions.allow_rsvp
--    entra). Um convite agora pertence a uma ocasião específica
--    (invitations.occasion_id, novo, not null) — a mesma pessoa pode ter
--    convites diferentes (com pessoas autorizadas diferentes) em ocasiões
--    diferentes do mesmo evento.
--
-- 2) "Quantidade máxima de acompanhantes" (guests.max_party_size + a
--    contagem simples em rsvp_responses.party_size) sai. Em vez de um
--    número, o admin cadastra nominalmente quem está autorizado
--    (rsvp_party_members, uma linha por pessoa, is_primary=true pra quem
--    é o responsável do convite). A "quantidade" agora é só a contagem de
--    linhas — nunca mais um campo solto que precisa ficar consistente à
--    mão. rsvp_responses (status+party_size agregado por convite) é
--    substituída por status individual por pessoa em
--    rsvp_party_members.status; o estado do convite como um todo
--    (pendente/confirmado/recusado) passa a ser DERIVADO na consulta
--    (nenhum membro respondeu -> pending; algum confirmado -> confirmed;
--    todos responderam e nenhum confirmado -> declined), nunca guardado
--    solto de novo.
-- =========================================================


-- ---------------------------------------------------------
-- 1. LIMPEZA DOS DADOS DE TESTE DO MODELO ANTERIOR
-- ---------------------------------------------------------

delete from public.invitations;

-- submit_rsvp antigo RETURNS public.rsvp_responses (o tipo composto da
-- tabela) — o Postgres registra isso como dependência real de tipo, então
-- precisa ser derrubado ANTES do DROP TABLE, senão o Postgres recusa com
-- "cannot drop table ... because other objects depend on it".
drop function if exists public.submit_rsvp(text, text, integer, text);
drop table public.rsvp_responses;

alter table public.guests drop column max_party_size;


-- ---------------------------------------------------------
-- 2. RSVP PASSA DE events PARA event_occasions
-- ---------------------------------------------------------

alter table public.events drop column allow_rsvp;

alter table public.event_occasions add column allow_rsvp boolean not null default false;
comment on column public.event_occasions.allow_rsvp is
  'Habilita RSVP só para ESTA ocasião. Substitui events.allow_rsvp (removida '
  'nesta migration) — cada ocasião do mesmo evento decide independentemente.';


-- ---------------------------------------------------------
-- 3. invitations PASSA A PERTENCER A UMA OCASIÃO
-- ---------------------------------------------------------

alter table public.invitations
  add column occasion_id uuid references public.event_occasions(id) on delete cascade;

-- Tabela já está vazia (seção 1) — set not null direto, sem precisar de
-- backfill.
alter table public.invitations alter column occasion_id set not null;

-- guest_id sozinho não é mais único: a mesma pessoa pode ter um convite na
-- ocasião A e outro na ocasião B, com composições de acompanhantes
-- diferentes. A unicidade passa a ser por (guest_id, occasion_id).
alter table public.invitations drop constraint if exists invitations_guest_id_key;
alter table public.invitations add constraint invitations_guest_id_occasion_id_key unique (guest_id, occasion_id);

create index idx_invitations_occasion_id on public.invitations (occasion_id);

comment on table public.invitations is
  'Credencial de acesso ao RSVP — 1:1 com (guest, occasion). Só guarda o hash '
  'do token (sha256, 64 hex chars); o token em texto puro nunca é persistido. '
  'Regenerar convite = sobrescrever token_hash, o que invalida o link anterior '
  'imediatamente.';


-- ---------------------------------------------------------
-- 4. rsvp_party_members — substitui rsvp_responses
-- ---------------------------------------------------------

create table public.rsvp_party_members (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  event_id      uuid not null references public.events(id) on delete cascade, -- denormalizado, resolvido no servidor
  name          text not null check (char_length(btrim(name)) > 0),
  -- true = é o próprio responsável do convite (guests.name no momento da
  -- criação). Toda linha nasce 'pending'; o convidado nunca cria/apaga
  -- linha, só muda status via submit_rsvp.
  is_primary    boolean not null default false,
  status        text not null default 'pending' check (status in ('pending','confirmed','declined')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.rsvp_party_members is
  'Uma linha por pessoa autorizada a comparecer num convite de RSVP. O '
  '"quantos podem vir" do convite é sempre count(*) desta tabela por '
  'invitation_id — nunca um número solto guardado em outro lugar.';

create index idx_rsvp_party_members_invitation_id on public.rsvp_party_members (invitation_id);
create index idx_rsvp_party_members_event_id      on public.rsvp_party_members (event_id);

-- Garante exatamente um responsável (is_primary=true) por convite —
-- barreira redundante à lógica da RPC create_invitation.
create unique index idx_rsvp_party_members_one_primary
  on public.rsvp_party_members (invitation_id)
  where is_primary;

create trigger trg_rsvp_party_members_updated_at
  before update on public.rsvp_party_members
  for each row execute function public.set_updated_at(); -- reaproveita a função da 00001

alter table public.rsvp_party_members enable row level security;

create policy rsvp_party_members_admin_read on public.rsvp_party_members
  for select to authenticated
  using (exists (
    select 1 from public.event_admins ea where ea.event_id = rsvp_party_members.event_id and ea.admin_id = auth.uid()
  ));
-- Nenhuma policy de insert/update/delete: toda escrita passa pelas RPCs
-- abaixo (SECURITY DEFINER, rodam como owner, ignoram RLS) — mesmo
-- invariante de guests/reservations/invitations desde a 00001/00006.

revoke insert, update, delete on public.rsvp_party_members from anon, authenticated;
revoke select on public.rsvp_party_members from anon;
grant select on public.rsvp_party_members to authenticated;


-- ---------------------------------------------------------
-- 5. RPCs — remove as antigas com assinatura/retorno incompatível,
--    recria com o novo modelo
-- ---------------------------------------------------------

drop function if exists public.create_invitation(text, text, text, integer, text);
drop function if exists public.resolve_invitation(text);
-- submit_rsvp antigo já foi derrubado na seção 1 (precisava vir antes do
-- DROP TABLE rsvp_responses, de que ele dependia).
-- regenerate_invitation mantém os mesmos TIPOS de parâmetro (uuid, text) e
-- o mesmo tipo de retorno, mas o Postgres não permite CREATE OR REPLACE
-- quando o NOME do parâmetro muda (p_guest_id -> p_invitation_id) — exige
-- DROP explícito mesmo sem mudança de tipo.
drop function if exists public.regenerate_invitation(uuid, text);


-- create_invitation (admin): cria/atualiza o guest responsável, o convite
-- (agora preso a uma ocasião) e as linhas de rsvp_party_members
-- (responsável + extras) atomicamente. event_id nunca é parâmetro —
-- resolvido a partir da ocasião. Só recebe o token_hash já calculado
-- (gerado em Node) — nunca vê o token puro.
create or replace function public.create_invitation(
  p_occasion_id       uuid,
  p_name              text,
  p_contact           text,
  p_contact_type      text,
  p_extra_member_names text[],
  p_token_hash        text
) returns table (out_guest_id uuid, out_invitation_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id      uuid;
  v_allow_rsvp    boolean;
  v_name          text := btrim(p_name);
  v_contact       text := lower(btrim(p_contact));
  v_guest         public.guests%rowtype;
  v_invitation_id uuid;
  v_extra_name    text;
begin
  if p_occasion_id is null then
    raise exception 'missing_parameters';
  end if;

  select eo.event_id, eo.allow_rsvp into v_event_id, v_allow_rsvp
  from public.event_occasions eo
  where eo.id = p_occasion_id;

  if v_event_id is null then
    raise exception 'occasion_not_found';
  end if;
  if not v_allow_rsvp then
    raise exception 'rsvp_disabled_for_occasion';
  end if;

  if not exists (
    select 1 from public.event_admins ea where ea.admin_id = auth.uid() and ea.event_id = v_event_id
  ) then
    raise exception 'not_authorized';
  end if;

  if v_name = '' or char_length(v_name) > 120 then
    raise exception 'invalid_name';
  end if;
  if v_contact = '' or char_length(v_contact) > 160 then
    raise exception 'invalid_contact';
  end if;
  if p_contact_type not in ('whatsapp','email') then
    raise exception 'invalid_contact_type';
  end if;
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    raise exception 'invalid_token';
  end if;
  if p_extra_member_names is not null and array_length(p_extra_member_names, 1) > 30 then
    raise exception 'too_many_members';
  end if;

  -- Mesmo guest de identify_guest: upsert por (event_id, contact). Se a
  -- pessoa já existir (ex.: já reservou um presente, ou já é responsável
  -- por outro convite noutra ocasião), este é o MESMO registro.
  insert into public.guests (event_id, name, contact, contact_type)
  values (v_event_id, v_name, v_contact, p_contact_type)
  on conflict (event_id, contact)
  do update set name = excluded.name, contact_type = excluded.contact_type
  returning * into v_guest;

  if exists (
    select 1 from public.invitations where guest_id = v_guest.id and occasion_id = p_occasion_id
  ) then
    raise exception 'invitation_already_exists';
  end if;

  insert into public.invitations (guest_id, occasion_id, event_id, token_hash)
  values (v_guest.id, p_occasion_id, v_event_id, p_token_hash)
  returning id into v_invitation_id;

  insert into public.rsvp_party_members (invitation_id, event_id, name, is_primary, status)
  values (v_invitation_id, v_event_id, v_name, true, 'pending');

  if p_extra_member_names is not null then
    foreach v_extra_name in array p_extra_member_names loop
      v_extra_name := btrim(v_extra_name);
      if v_extra_name <> '' then
        if char_length(v_extra_name) > 120 then
          raise exception 'invalid_name';
        end if;
        insert into public.rsvp_party_members (invitation_id, event_id, name, is_primary, status)
        values (v_invitation_id, v_event_id, v_extra_name, false, 'pending');
      end if;
    end loop;
  end if;

  out_guest_id := v_guest.id;
  out_invitation_id := v_invitation_id;
  return next;
end;
$$;
revoke all on function public.create_invitation(uuid, text, text, text, text[], text) from public;
grant execute on function public.create_invitation(uuid, text, text, text, text[], text) to authenticated;
comment on function public.create_invitation is
  'Único ponto de criação de convite de RSVP. Ocasião precisa existir, '
  'pertencer a um evento do admin autenticado e ter allow_rsvp=true. Atômico: '
  'guest + invitation + rsvp_party_members (responsável e extras) numa só '
  'transação.';


-- add_party_member (admin): adiciona uma pessoa autorizada a um convite já
-- criado.
create or replace function public.add_party_member(
  p_invitation_id uuid,
  p_name          text
) returns public.rsvp_party_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_name     text := btrim(p_name);
  v_member   public.rsvp_party_members%rowtype;
  v_count    integer;
begin
  if p_invitation_id is null then
    raise exception 'missing_parameters';
  end if;
  if v_name = '' or char_length(v_name) > 120 then
    raise exception 'invalid_name';
  end if;

  select event_id into v_event_id from public.invitations where id = p_invitation_id;
  if v_event_id is null then
    raise exception 'invitation_not_found';
  end if;

  if not exists (
    select 1 from public.event_admins where admin_id = auth.uid() and event_id = v_event_id
  ) then
    raise exception 'not_authorized';
  end if;

  select count(*) into v_count from public.rsvp_party_members where invitation_id = p_invitation_id;
  if v_count >= 30 then
    raise exception 'too_many_members';
  end if;

  insert into public.rsvp_party_members (invitation_id, event_id, name, is_primary, status)
  values (p_invitation_id, v_event_id, v_name, false, 'pending')
  returning * into v_member;

  return v_member;
end;
$$;
revoke all on function public.add_party_member(uuid, text) from public;
grant execute on function public.add_party_member(uuid, text) to authenticated;


-- remove_party_member (admin): nunca permite remover o responsável
-- (is_primary) — pra isso o convite inteiro precisaria deixar de existir,
-- o que este MVP não faz (sem DELETE em invitations por desenho).
create or replace function public.remove_party_member(p_party_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id   uuid;
  v_is_primary boolean;
begin
  if p_party_member_id is null then
    raise exception 'missing_parameters';
  end if;

  select event_id, is_primary into v_event_id, v_is_primary
  from public.rsvp_party_members where id = p_party_member_id;

  if v_event_id is null then
    raise exception 'member_not_found';
  end if;

  if not exists (
    select 1 from public.event_admins where admin_id = auth.uid() and event_id = v_event_id
  ) then
    raise exception 'not_authorized';
  end if;

  if v_is_primary then
    raise exception 'cannot_remove_primary';
  end if;

  delete from public.rsvp_party_members where id = p_party_member_id;
end;
$$;
revoke all on function public.remove_party_member(uuid) from public;
grant execute on function public.remove_party_member(uuid) to authenticated;


-- rename_party_member (admin): corrige o nome de uma pessoa já cadastrada
-- (inclusive o responsável).
create or replace function public.rename_party_member(
  p_party_member_id uuid,
  p_name            text
) returns public.rsvp_party_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_name     text := btrim(p_name);
  v_member   public.rsvp_party_members%rowtype;
begin
  if p_party_member_id is null then
    raise exception 'missing_parameters';
  end if;
  if v_name = '' or char_length(v_name) > 120 then
    raise exception 'invalid_name';
  end if;

  select event_id into v_event_id from public.rsvp_party_members where id = p_party_member_id;
  if v_event_id is null then
    raise exception 'member_not_found';
  end if;

  if not exists (
    select 1 from public.event_admins where admin_id = auth.uid() and event_id = v_event_id
  ) then
    raise exception 'not_authorized';
  end if;

  update public.rsvp_party_members set name = v_name where id = p_party_member_id
  returning * into v_member;

  return v_member;
end;
$$;
revoke all on function public.rename_party_member(uuid, text) from public;
grant execute on function public.rename_party_member(uuid, text) to authenticated;


-- regenerate_invitation (admin): agora identificado por invitation_id (um
-- guest pode ter mais de um convite, um por ocasião) — sobrescreve
-- token_hash, o token anterior para de bater com qualquer linha na hora.
create or replace function public.regenerate_invitation(
  p_invitation_id uuid,
  p_token_hash    text
) returns public.invitations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id   uuid;
  v_invitation public.invitations%rowtype;
begin
  if p_invitation_id is null then
    raise exception 'missing_parameters';
  end if;
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    raise exception 'invalid_token';
  end if;

  select event_id into v_event_id from public.invitations where id = p_invitation_id;
  if v_event_id is null then
    raise exception 'invitation_not_found';
  end if;

  if not exists (
    select 1 from public.event_admins where admin_id = auth.uid() and event_id = v_event_id
  ) then
    raise exception 'not_authorized';
  end if;

  update public.invitations
     set token_hash = p_token_hash, last_accessed_at = null
   where id = p_invitation_id
  returning * into v_invitation;

  return v_invitation;
end;
$$;
revoke all on function public.regenerate_invitation(uuid, text) from public;
grant execute on function public.regenerate_invitation(uuid, text) to authenticated;


-- resolve_invitation (público): único ponto de leitura por token. Erro
-- genérico se não achar. Se a ocasião teve o RSVP desativado depois do
-- convite criado, erro específico (não revela nada sobre o convite em si,
-- só que o recurso está indisponível agora). Devolve as pessoas
-- autorizadas agregadas em jsonb — evita uma segunda RPC/tabela exposta
-- pro client.
create or replace function public.resolve_invitation(p_token_hash text)
returns table (
  out_invitation_id uuid,
  out_guest_id      uuid,
  out_guest_name    text,
  out_event_id      uuid,
  out_occasion_id   uuid,
  out_party_members jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.invitations%rowtype;
  v_guest      public.guests%rowtype;
  v_allow_rsvp boolean;
  v_members    jsonb;
begin
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    raise exception 'invitation_not_found';
  end if;

  select * into v_invitation from public.invitations i where i.token_hash = p_token_hash;
  if not found then
    raise exception 'invitation_not_found';
  end if;

  select eo.allow_rsvp into v_allow_rsvp
  from public.event_occasions eo where eo.id = v_invitation.occasion_id;
  if not coalesce(v_allow_rsvp, false) then
    raise exception 'rsvp_disabled_for_occasion';
  end if;

  select * into v_guest from public.guests g where g.id = v_invitation.guest_id;

  update public.invitations set last_accessed_at = now() where id = v_invitation.id;

  select coalesce(jsonb_agg(
           jsonb_build_object('id', m.id, 'name', m.name, 'status', m.status, 'is_primary', m.is_primary)
           order by m.is_primary desc, m.created_at
         ), '[]'::jsonb)
    into v_members
  from public.rsvp_party_members m
  where m.invitation_id = v_invitation.id;

  out_invitation_id := v_invitation.id;
  out_guest_id := v_guest.id;
  out_guest_name := v_guest.name;
  out_event_id := v_guest.event_id;
  out_occasion_id := v_invitation.occasion_id;
  out_party_members := v_members;
  return next;
end;
$$;
revoke all on function public.resolve_invitation(text) from public;
grant execute on function public.resolve_invitation(text) to anon, authenticated;


-- submit_rsvp (público): recebe os ids das pessoas confirmadas (array
-- vazio = "não poderei comparecer", todo mundo declined). Cada id
-- PRECISA pertencer a este convite — nunca confia cegamente num array de
-- uuid vindo do cliente (poderia ser id de pessoa de outro convite).
create or replace function public.submit_rsvp(
  p_token_hash          text,
  p_confirmed_member_ids uuid[]
) returns table (out_invitation_id uuid, out_party_members jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation      public.invitations%rowtype;
  v_allow_rsvp      boolean;
  v_confirmed_ids   uuid[] := coalesce(p_confirmed_member_ids, '{}'::uuid[]);
  v_requested_count integer := coalesce(array_length(p_confirmed_member_ids, 1), 0);
  v_valid_count     integer;
  v_members         jsonb;
begin
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    raise exception 'invitation_not_found';
  end if;

  select * into v_invitation from public.invitations i where i.token_hash = p_token_hash;
  if not found then
    raise exception 'invitation_not_found';
  end if;

  select eo.allow_rsvp into v_allow_rsvp
  from public.event_occasions eo where eo.id = v_invitation.occasion_id;
  if not coalesce(v_allow_rsvp, false) then
    raise exception 'rsvp_disabled_for_occasion';
  end if;

  if v_requested_count > 0 then
    select count(*) into v_valid_count
    from public.rsvp_party_members
    where invitation_id = v_invitation.id and id = any(v_confirmed_ids);

    if v_valid_count <> v_requested_count then
      raise exception 'invalid_member_ids';
    end if;
  end if;

  update public.rsvp_party_members
     set status = case when id = any(v_confirmed_ids) then 'confirmed' else 'declined' end
   where invitation_id = v_invitation.id;

  update public.invitations set last_accessed_at = now() where id = v_invitation.id;

  select coalesce(jsonb_agg(
           jsonb_build_object('id', m.id, 'name', m.name, 'status', m.status, 'is_primary', m.is_primary)
           order by m.is_primary desc, m.created_at
         ), '[]'::jsonb)
    into v_members
  from public.rsvp_party_members m
  where m.invitation_id = v_invitation.id;

  out_invitation_id := v_invitation.id;
  out_party_members := v_members;
  return next;
end;
$$;
revoke all on function public.submit_rsvp(text, uuid[]) from public;
grant execute on function public.submit_rsvp(text, uuid[]) to anon, authenticated;
comment on function public.submit_rsvp is
  'Único ponto de escrita em rsvp_party_members pelo convidado. Convite '
  'resolvido só pelo hash do token. Cada id em p_confirmed_member_ids é '
  'validado contra este invitation_id antes de aplicar — nunca confia no '
  'array do cliente. Reabrir o link e responder de novo só reaplica o '
  'mesmo UPDATE, nunca duplica membro.';
