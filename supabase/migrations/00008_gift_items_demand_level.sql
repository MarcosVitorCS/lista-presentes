-- =========================================================
-- 00008_gift_items_demand_level.sql — indicador de demanda (privacy-safe)
--
-- Adiciona um bucket qualitativo grosseiro (demand_level) à view pública,
-- calculado a partir de quantity_total/quantity_reserved (privados) sem
-- expor nenhum dos dois brutos nem uma porcentagem precisa: porcentagem
-- precisa + quantity_available (já público) permite reconstruir
-- quantity_total exatamente por álgebra (available = total - reserved,
-- pct = reserved/total => total = available / (1 - pct)), então a UI só
-- recebe uma categoria discreta, nunca o número.
-- =========================================================

-- CREATE OR REPLACE VIEW só é permitido quando a nova versão apenas ACRESCENTA
-- colunas ao final da lista original — é o caso aqui.
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
  purchase_url,
  case
    when quantity_available = 0 then 'sold_out'
    when quantity_available = 1 and quantity_total > 1 then 'almost_gone'
    when quantity_reserved > 0 then 'some_reserved'
    else 'available'
  end as demand_level
from public.gift_items
where is_active = true;

comment on view public.gift_items_public is
  'View pública e restrita do catálogo: sem quantity_total/quantity_reserved brutos, sem dados '
  'administrativos ou de reserva. demand_level é um bucket qualitativo (sold_out/almost_gone/'
  'some_reserved/available) calculado a partir dos números privados — nunca expõe porcentagem '
  'precisa, que permitiria reconstruir quantity_total via available = total - reserved. Colunas '
  'expostas: id, list_id, event_id, name, description, image_url, unit_price, quantity_available, '
  'is_active, purchase_url, demand_level.';

-- Reconcede o GRANT explícito (CREATE OR REPLACE VIEW não herda os grants
-- automaticamente em todas as versões do Postgres — mais seguro reafirmar).
revoke all on public.gift_items_public from public, anon, authenticated;
grant select on public.gift_items_public to anon, authenticated;
