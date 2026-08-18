-- =========================================================
-- supabase/seed/001_bootstrap.sql
--
-- BOOTSTRAP MANUAL — executar UMA ÚNICA VEZ, manualmente, DEPOIS de aplicar
-- a migration 00001_init_schema.sql.
--
-- NÃO faz parte de nenhum pipeline automático de deploy/CI. NÃO cria usuário
-- de Auth via SQL (isso é feito pelo Dashboard/CLI do Supabase, nunca por
-- migration). Rode os passos abaixo em ordem, no SQL editor do Supabase,
-- substituindo os placeholders <ADMIN_UUID> e <EVENT_ID> pelos valores reais
-- obtidos em cada passo.
-- =========================================================


-- ---------------------------------------------------------
-- PASSO 1 — Criar o primeiro usuário admin no Supabase Auth
-- ---------------------------------------------------------
-- Isso NÃO é feito por SQL. Use um dos dois caminhos:
--
--   a) Dashboard do Supabase:
--      Authentication > Users > "Add user"
--      (defina e-mail + senha do casal/administrador)
--
--   b) Supabase CLI:
--      supabase auth admin create-user --email admin@exemplo.com --password "SENHA-FORTE-AQUI"
--
-- A trigger trg_on_auth_user_created (criada na migration 00001) já insere
-- automaticamente a linha correspondente em public.admin_profiles assim que
-- o usuário é criado. NÃO é necessário (nem possível, via RLS) inserir
-- manualmente em admin_profiles.


-- ---------------------------------------------------------
-- PASSO 2 — Obter o UUID do usuário criado
-- ---------------------------------------------------------
-- Dashboard: Authentication > Users > copiar o "User UID" da linha criada.
-- Ou via SQL, rodado como owner do banco no SQL editor do Supabase:

select id, email from auth.users where email = 'admin@exemplo.com';

-- Confirme também que a trigger populou admin_profiles:
-- select * from public.admin_profiles where id = '<ADMIN_UUID>';

-- Substitua <ADMIN_UUID> pelo valor retornado nos passos 3/4 abaixo.


-- ---------------------------------------------------------
-- PASSO 3 — Criar o evento
-- ---------------------------------------------------------
insert into public.events (
  slug, name, event_date,
  pix_key, pix_key_type, pix_owner_name, pix_qr_code_url,
  is_active
)
values (
  'rafaely-e-vitor',
  'Rafaely & Vitor',
  null,   -- ajustar para a data do evento quando definida (formato 'YYYY-MM-DD')
  null,   -- ajustar chave PIX
  null,   -- 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  null,   -- nome do titular da chave PIX
  null,   -- URL do QR code estático (ex.: asset público hospedado no projeto ou no Storage)
  true
)
returning id;

-- Guarde o id retornado — substitua <EVENT_ID> no passo 4.


-- ---------------------------------------------------------
-- PASSO 4 — Associar o admin ao evento
-- ---------------------------------------------------------
insert into public.event_admins (event_id, admin_id, role)
values ('<EVENT_ID>', '<ADMIN_UUID>', 'owner');


-- ---------------------------------------------------------
-- PASSO 5 — Verificação
-- ---------------------------------------------------------
select
  e.slug,
  e.name,
  e.is_active,
  a.full_name,
  ea.role
from public.event_admins ea
join public.events e         on e.id = ea.event_id
join public.admin_profiles a on a.id = ea.admin_id;

-- Esperado: uma linha com slug='rafaely-e-vitor', role='owner', ligando o
-- admin recém-criado ao evento.


-- ---------------------------------------------------------
-- PASSO 6 (opcional, quando o catálogo já estiver pronto) — criar as listas
-- ---------------------------------------------------------
-- Exemplo de como popular gift_lists (não obrigatório rodar agora — pode ser
-- feito depois, via app, pelo próprio admin autenticado, já que
-- gift_lists_admin_write permite INSERT/UPDATE para quem está em event_admins):
--
-- insert into public.gift_lists (event_id, slug, type, name, description)
-- values
--   ('<EVENT_ID>', 'cha-de-cozinha', 'physical', 'Chá de Cozinha', null),
--   ('<EVENT_ID>', 'casamento',      'quota',    'Casamento',      null);
