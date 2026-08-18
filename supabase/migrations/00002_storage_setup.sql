-- =========================================================
-- 00002_storage_setup.sql — bucket de imagens (itens do catálogo + QR PIX)
--
-- Bucket PÚBLICO: leitura via URL pública (/storage/v1/object/public/...)
-- não passa por RLS — é assim que o convidado vê as imagens sem precisar de
-- token. RLS aqui controla só quem pode ESCREVER (insert/update/delete).
--
-- Convenção de path: todo arquivo fica em "<event_id>/<uuid>.<ext>" — a
-- policy usa storage.foldername(name) para extrair o primeiro segmento do
-- path e comparar com os eventos que o admin autenticado administra. Mesmo
-- padrão de isolamento por evento já usado nas tabelas do schema principal.
-- =========================================================

insert into storage.buckets (id, name, public)
values ('gift-images', 'gift-images', true)
on conflict (id) do nothing;

create policy "gift_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'gift-images'
    and exists (
      select 1 from public.event_admins ea
      where ea.admin_id = auth.uid()
        and ea.event_id::text = (storage.foldername(name))[1]
    )
  );

create policy "gift_images_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'gift-images'
    and exists (
      select 1 from public.event_admins ea
      where ea.admin_id = auth.uid()
        and ea.event_id::text = (storage.foldername(name))[1]
    )
  );

create policy "gift_images_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'gift-images'
    and exists (
      select 1 from public.event_admins ea
      where ea.admin_id = auth.uid()
        and ea.event_id::text = (storage.foldername(name))[1]
    )
  );

-- Leitura via API autenticada/anon (a URL pública já funciona sem isso, mas
-- deixamos explícito para uso futuro, ex.: listar arquivos no admin).
create policy "gift_images_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'gift-images');
