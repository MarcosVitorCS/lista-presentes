-- =========================================================
-- 00006_rsvp.sql — módulo de Confirmação de Presença (RSVP)
--
-- Aditiva apenas: nenhum DROP, nenhum DELETE, nenhuma tabela/coluna/RPC
-- existente é alterada. gift_lists/gift_items/reservations/identify_guest/
-- create_reservation/confirm_reservation/cancel_reservation continuam
-- exatamente como estão — RSVP é um módulo paralelo que reaproveita apenas
-- a identidade em `guests`, sem depender de reserva de presente nem afetá-la.
--
-- Modelo (3 peças, mesmo raciocínio de separação já usado pra
-- event_occasions vs gift_lists — "quem" / "como acessa" / "o que respondeu"
-- são coisas que mudam em momentos e por atores diferentes):
--
--   guests.max_party_size  — quantas pessoas aquele convite comporta.
--                             NULL = convidado nunca foi convidado pra RSVP
--                             (ex.: só se identificou pra reservar presente).
--   invitations             — a credencial de acesso (token). 1:1 com guest.
--   rsvp_responses          — o estado da resposta (pending/confirmed/
--                             declined) + quantas pessoas confirmaram. 1:1
--                             com guest.
--
-- Segurança do token (decisão confirmada com o cliente):
--   - Gerado com node:crypto (256 bits) NO SERVIDOR (Server Action),
--     nunca no client, nunca em RPC — evita depender de pgcrypto.
--   - Só o SHA-256 (hex, 64 chars) chega ao banco, em invitations.token_hash.
--     O token em texto puro nunca é persistido em lugar nenhum.
--   - Link é exibido/copiável só uma vez, na criação (a action devolve o
--     token puro na resposta, nunca de volta numa leitura futura). Pra
--     reobter depois, o admin regenera (invalida o anterior).
--
-- Toda escrita em guests/invitations/rsvp_responses continua exclusivamente
-- via RPC SECURITY DEFINER — mesmo invariante já usado por guests/
-- reservations desde a 00001 (nenhum GRANT de insert/update pra
-- anon/authenticated nessas 3 tabelas).
-- =========================================================


-- ---------------------------------------------------------
-- 1. COLUNAS NOVAS
-- ---------------------------------------------------------

alter table public.guests
  add column max_party_size integer check (max_party_size is null or (max_party_size > 0 and max_party_size <= 50));
comment on column public.guests.max_party_size is
  'Capacidade máxima de pessoas do convite de RSVP deste convidado. NULL = não é '
  'convidado de RSVP (ex.: só se identificou pra reservar presente).';

alter table public.events
  add column allow_rsvp boolean not null default false;
comment on column public.events.allow_rsvp is
  'Habilita o módulo de Confirmação de Presença pra este evento. Eventos com '
  'false continuam funcionando exatamente como antes (nenhuma UI de RSVP aparece).';


-- ---------------------------------------------------------
-- 2. TABELAS
-- ---------------------------------------------------------

create table public.invitations (
  id               uuid primary key default gen_random_uuid(),
  guest_id         uuid not null unique references public.guests(id) on delete cascade,
  event_id         uuid not null references public.events(id) on delete cascade, -- denormalizado, resolvido sempre no servidor
  token_hash       text not null unique check (char_length(token_hash) = 64),
  created_at       timestamptz not null default now(),
  last_accessed_at timestamptz
);
comment on table public.invitations is
  'Credencial de acesso ao RSVP — 1:1 com guests. Só guarda o hash do token '
  '(sha256, 64 hex chars); o token em texto puro nunca é persistido. Regenerar '
  'convite = sobrescrever token_hash, o que invalida o link anterior imediatamente.';
comment on column public.invitations.token_hash is
  'sha256(token) em hex. anon nunca tem SELECT nesta tabela — a única forma de '
  'resolver um convite é via RPC resolve_invitation, que recebe o hash já calculado.';

create index idx_invitations_event_id on public.invitations (event_id);

create table public.rsvp_responses (
  id            uuid primary key default gen_random_uuid(),
  guest_id      uuid not null unique references public.guests(id) on delete cascade,
  event_id      uuid not null references public.events(id) on delete cascade, -- denormalizado
  status        text not null default 'pending' check (status in ('pending','confirmed','declined')),
  party_size    integer check (party_size is null or (party_size > 0 and party_size <= 50)),
  notes         text,
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint rsvp_confirmed_has_party_size check (status <> 'confirmed' or party_size is not null)
);
comment on table public.rsvp_responses is
  'Estado da resposta de RSVP — 1:1 com guests. party_size <= guests.max_party_size '
  'é validado na RPC submit_rsvp (não expressável como CHECK simples, envolve outra '
  'tabela); o CHECK acima é só a barreira redundante "confirmed sempre tem quantidade".';

create index idx_rsvp_responses_event_id on public.rsvp_responses (event_id);
create index idx_rsvp_responses_status   on public.rsvp_responses (status);

create trigger trg_rsvp_responses_updated_at
  before update on public.rsvp_responses
  for each row execute function public.set_updated_at(); -- reaproveita a função da 00001


-- ---------------------------------------------------------
-- 3. RPCs (SECURITY DEFINER)
-- ---------------------------------------------------------

-- create_invitation (admin): cria/atualiza guest + rsvp_responses(pending) +
-- invitations atomicamente. event_id NUNCA é parâmetro — resolvido aqui
-- dentro a partir de event_admins/auth.uid(), igual ao padrão de
-- confirm_reservation/cancel_reservation. Só recebe o token_hash já
-- calculado (gerado em Node, no Server Action) — a RPC nunca vê o token puro.
-- Os parâmetros de saída (returns table) NÃO se chamam guest_id/
-- invitation_id — esses nomes colidiriam com as colunas de mesmo nome
-- referenciadas dentro do corpo (INSERT ... ON CONFLICT (guest_id)), e
-- PL/pgSQL levanta "column reference is ambiguous" (42702) em tempo de
-- execução quando isso acontece. out_ prefixado evita a colisão.
create or replace function public.create_invitation(
  p_name           text,
  p_contact        text,
  p_contact_type   text,
  p_max_party_size integer,
  p_token_hash     text
) returns table (out_guest_id uuid, out_invitation_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_name     text := btrim(p_name);
  v_contact  text := lower(btrim(p_contact));
  v_guest    public.guests%rowtype;
  v_invitation_id uuid;
begin
  select ea.event_id into v_event_id from public.event_admins ea where ea.admin_id = auth.uid() limit 1;
  if v_event_id is null then
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
  if p_max_party_size is null or p_max_party_size <= 0 or p_max_party_size > 50 then
    raise exception 'invalid_max_party_size';
  end if;
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    raise exception 'invalid_token';
  end if;

  -- Mesmo guest de identify_guest: upsert por (event_id, contact). Se a
  -- pessoa já existir (ex.: já reservou um presente com o mesmo contato),
  -- este é o MESMO registro — não duplica identidade.
  insert into public.guests (event_id, name, contact, contact_type, max_party_size)
  values (v_event_id, v_name, v_contact, p_contact_type, p_max_party_size)
  on conflict (event_id, contact)
  do update set name = excluded.name, contact_type = excluded.contact_type, max_party_size = excluded.max_party_size
  returning * into v_guest;

  insert into public.rsvp_responses (guest_id, event_id, status)
  values (v_guest.id, v_event_id, 'pending')
  on conflict (guest_id) do nothing;

  insert into public.invitations (guest_id, event_id, token_hash)
  values (v_guest.id, v_event_id, p_token_hash)
  on conflict (guest_id) do update set token_hash = excluded.token_hash, last_accessed_at = null
  returning id into v_invitation_id;

  out_guest_id := v_guest.id;
  out_invitation_id := v_invitation_id;
  return next;
end;
$$;
revoke all on function public.create_invitation(text, text, text, integer, text) from public;
grant execute on function public.create_invitation(text, text, text, integer, text) to authenticated;
comment on function public.create_invitation is
  'Único ponto de criação de convite de RSVP. event_id nunca é parâmetro — '
  'resolvido via event_admins/auth.uid(). Atômico: guest+rsvp_responses+invitations '
  'numa só transação (corpo da função).';


-- regenerate_invitation (admin): sobrescreve token_hash — o token anterior
-- para de bater com qualquer linha imediatamente. Autorização via
-- event_admins, nunca confiando em event_id do cliente.
create or replace function public.regenerate_invitation(
  p_guest_id   uuid,
  p_token_hash text
) returns public.invitations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id   uuid;
  v_invitation public.invitations%rowtype;
begin
  if p_guest_id is null then
    raise exception 'missing_parameters';
  end if;
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    raise exception 'invalid_token';
  end if;

  select g.event_id into v_event_id from public.guests g where g.id = p_guest_id;
  if v_event_id is null then
    raise exception 'guest_not_found';
  end if;

  if not exists (
    select 1 from public.event_admins ea where ea.admin_id = auth.uid() and ea.event_id = v_event_id
  ) then
    raise exception 'not_authorized';
  end if;

  update public.invitations
     set token_hash = p_token_hash, last_accessed_at = null
   where guest_id = p_guest_id
  returning * into v_invitation;

  if not found then
    raise exception 'invitation_not_found';
  end if;

  return v_invitation;
end;
$$;
revoke all on function public.regenerate_invitation(uuid, text) from public;
grant execute on function public.regenerate_invitation(uuid, text) to authenticated;


-- resolve_invitation (público): único ponto de leitura por token. Erro
-- genérico se não achar — não revela se o token é malformado, revogado ou
-- nunca existiu. Não retorna nada de outros convidados. Atualiza
-- last_accessed_at como efeito colateral (bookkeeping, não afeta RSVP).
create or replace function public.resolve_invitation(p_token_hash text)
returns table (
  guest_id        uuid,
  guest_name      text,
  event_id        uuid,
  max_party_size  integer,
  status          text,
  party_size      integer,
  notes           text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.invitations%rowtype;
  v_guest      public.guests%rowtype;
  v_rsvp       public.rsvp_responses%rowtype;
begin
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    raise exception 'invitation_not_found';
  end if;

  select * into v_invitation from public.invitations i where i.token_hash = p_token_hash;
  if not found then
    raise exception 'invitation_not_found';
  end if;

  select * into v_guest from public.guests g where g.id = v_invitation.guest_id;
  select * into v_rsvp from public.rsvp_responses r where r.guest_id = v_invitation.guest_id;

  update public.invitations set last_accessed_at = now() where id = v_invitation.id;

  guest_id := v_guest.id;
  guest_name := v_guest.name;
  event_id := v_guest.event_id;
  max_party_size := v_guest.max_party_size;
  status := coalesce(v_rsvp.status, 'pending');
  party_size := v_rsvp.party_size;
  notes := v_rsvp.notes;
  return next;
end;
$$;
revoke all on function public.resolve_invitation(text) from public;
grant execute on function public.resolve_invitation(text) to anon, authenticated;


-- submit_rsvp (público): único ponto de escrita em rsvp_responses pelo
-- convidado. Resolve guest/event SEMPRE a partir do token — nunca aceita
-- guest_id/event_id do cliente. party_size validado contra
-- guests.max_party_size aqui dentro (não expressável em CHECK simples).
create or replace function public.submit_rsvp(
  p_token_hash text,
  p_status     text,
  p_party_size integer,
  p_notes      text
) returns public.rsvp_responses
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.invitations%rowtype;
  v_guest      public.guests%rowtype;
  v_party_size integer;
  v_notes      text := nullif(btrim(coalesce(p_notes, '')), '');
  v_rsvp       public.rsvp_responses%rowtype;
begin
  if p_token_hash is null or char_length(p_token_hash) <> 64 then
    raise exception 'invitation_not_found';
  end if;
  if p_status not in ('confirmed', 'declined') then
    raise exception 'invalid_status';
  end if;
  if v_notes is not null and char_length(v_notes) > 300 then
    raise exception 'invalid_notes';
  end if;

  select * into v_invitation from public.invitations i where i.token_hash = p_token_hash;
  if not found then
    raise exception 'invitation_not_found';
  end if;

  select * into v_guest from public.guests g where g.id = v_invitation.guest_id;

  -- Guarda redundante: se por algum motivo o convidado não tiver
  -- max_party_size definido, "p_party_size > null" avaliaria NULL (não
  -- true) no IF abaixo e passaria batido. create_invitation sempre define
  -- max_party_size junto com o convite, então isso não deveria acontecer —
  -- mas falha fechado em vez de aberto se acontecer.
  if v_guest.max_party_size is null then
    raise exception 'invalid_party_size';
  end if;

  if p_status = 'confirmed' then
    if p_party_size is null or p_party_size < 1 or p_party_size > v_guest.max_party_size then
      raise exception 'invalid_party_size';
    end if;
    v_party_size := p_party_size;
  else
    v_party_size := null; -- recusa nunca guarda quantidade, mesmo se o cliente enviar uma
  end if;

  update public.invitations set last_accessed_at = now() where id = v_invitation.id;

  insert into public.rsvp_responses (guest_id, event_id, status, party_size, notes, responded_at)
  values (v_guest.id, v_guest.event_id, p_status, v_party_size, v_notes, now())
  on conflict (guest_id) do update
    set status       = excluded.status,
        party_size   = excluded.party_size,
        notes        = excluded.notes,
        responded_at = excluded.responded_at
  returning * into v_rsvp;

  return v_rsvp;
end;
$$;
revoke all on function public.submit_rsvp(text, text, integer, text) from public;
grant execute on function public.submit_rsvp(text, text, integer, text) to anon, authenticated;
comment on function public.submit_rsvp is
  'Único ponto de escrita em rsvp_responses pelo convidado. Convite resolvido '
  'só pelo hash do token — nunca por guest_id/event_id vindos do cliente. '
  'Reabrir o link e responder de novo apenas atualiza a mesma linha (upsert '
  'por guest_id), nunca duplica RSVP.';


-- ---------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------

alter table public.invitations    enable row level security;
alter table public.rsvp_responses enable row level security;

-- Só leitura para o admin do próprio evento — nenhuma policy de
-- insert/update/delete em nenhuma das duas tabelas: toda escrita passa
-- exclusivamente pelas RPCs acima (que rodam como owner, ignoram RLS).
create policy invitations_admin_read on public.invitations
  for select to authenticated
  using (exists (
    select 1 from public.event_admins ea where ea.event_id = invitations.event_id and ea.admin_id = auth.uid()
  ));

create policy rsvp_responses_admin_read on public.rsvp_responses
  for select to authenticated
  using (exists (
    select 1 from public.event_admins ea where ea.event_id = rsvp_responses.event_id and ea.admin_id = auth.uid()
  ));


-- ---------------------------------------------------------
-- 5. GRANT / REVOKE (defesa em profundidade além do RLS)
-- ---------------------------------------------------------

-- anon não lê nenhuma das duas tabelas em hipótese alguma — o único caminho
-- público é resolve_invitation/submit_rsvp (RPCs, rodam como owner).
revoke insert, update, delete on public.invitations, public.rsvp_responses from anon, authenticated;
revoke select on public.invitations, public.rsvp_responses from anon;
grant select on public.invitations, public.rsvp_responses to authenticated;

-- guests: nenhum GRANT novo. create_invitation/regenerate_invitation são
-- SECURITY DEFINER e escrevem como owner da função — o invariante "toda
-- escrita em guests só via RPC", já existente desde a 00001, continua
-- intacto (nenhum INSERT/UPDATE direto liberado pra authenticated).

-- events: admin passa a poder também alternar allow_rsvp — já cobrido pelo
-- GRANT UPDATE existente na 00001 (grant update on public.events to
-- authenticated), sem coluna específica listada; nenhuma mudança necessária.
