-- =========================================================
-- 00009_delete_invitation.sql — excluir um convite de RSVP inteiro
--
-- Diferente de cancelar uma reserva (soft: linha preservada, status vira
-- 'cancelled'), aqui o pedido do admin é remover de vez um convite criado
-- por engano/teste — sem deixar rastro. rsvp_party_members já tem
-- `on delete cascade` em invitation_id (migration 00007), então apagar a
-- linha de invitations já leva os party members junto, sem precisar de
-- lógica extra aqui.
--
-- guests é preservado de propósito: o convidado pode ter outro convite
-- (outra ocasião) ou reservas associadas a ele — nenhuma das duas depende
-- de invitations, e apagar o guest seria uma ação bem maior do que "excluir
-- este convite".
-- =========================================================

create or replace function public.delete_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
begin
  if p_invitation_id is null then
    raise exception 'missing_parameters';
  end if;

  select event_id into v_event_id
  from public.invitations
  where id = p_invitation_id;

  if v_event_id is null then
    raise exception 'invitation_not_found';
  end if;

  if not exists (
    select 1 from public.event_admins
    where admin_id = auth.uid() and event_id = v_event_id
  ) then
    raise exception 'not_authorized';
  end if;

  delete from public.invitations where id = p_invitation_id;
end;
$$;

comment on function public.delete_invitation is
  'Exclui um convite de RSVP inteiro (e seus rsvp_party_members, via cascade) — para o admin remover '
  'um convite de teste ou criado por engano. Não afeta o guest (pode ter outros convites/reservas). '
  'Ação irreversível, diferente de cancel_reservation (que preserva histórico).';

revoke all on function public.delete_invitation(uuid) from public;
grant execute on function public.delete_invitation(uuid) to authenticated;
