begin;
alter table public.products add column if not exists cover_path text;
alter table public.products add column if not exists file_type text;
alter table public.products add column if not exists file_size bigint check(file_size>0 and file_size<=10485760);
-- Covers are intentionally public. Purchased files stay in the existing private products bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('covers','covers',true,2097152,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
drop policy if exists "Users upload own covers" on storage.objects;
create policy "Users upload own covers" on storage.objects for insert to authenticated
with check(bucket_id='covers' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
