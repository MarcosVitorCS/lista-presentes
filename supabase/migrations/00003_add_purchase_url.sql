-- =========================================================
-- 00003_add_purchase_url.sql — link sugerido de loja por item
--
-- Campo opcional em gift_items: o admin pode sugerir onde o convidado
-- encontra o item (Chá de Cozinha) ou uma referência do que a cota
-- representa (Casamento — ex.: link da agência de viagem pra "Lua de Mel").
-- Não interfere em estoque/reserva/concorrência — é só informativo.
-- =========================================================

alter table public.gift_items add column purchase_url text;

comment on column public.gift_items.purchase_url is
  'Link opcional sugerindo onde comprar/mais informações sobre o item. Puramente informativo — não é usado por nenhuma RPC.';

-- CREATE OR REPLACE VIEW só é permitido quando a nova versão apenas ACRESCENTA
-- colunas ao final da lista original — é o caso aqui, então a view não
-- precisa ser dropada e recriada.
create or replace view public.gift_items_public as
select
  id,
  list_id,
  event_id,
  name,
  description,
  image_url,
  unit_price,
  quantity_available,
  is_active,
  purchase_url
from public.gift_items
where is_active = true;

-- Reconcede o GRANT explícito (CREATE OR REPLACE VIEW não herda os grants
-- automaticamente em todas as versões do Postgres — mais seguro reafirmar).
revoke all on public.gift_items_public from public, anon, authenticated;
grant select on public.gift_items_public to anon, authenticated;

-- Admin passa a poder gravar esse campo também.
grant insert (list_id, name, description, image_url, unit_price, quantity_total, is_active, purchase_url)
  on public.gift_items to authenticated;
grant update (name, description, image_url, unit_price, quantity_total, is_active, purchase_url)
  on public.gift_items to authenticated;
