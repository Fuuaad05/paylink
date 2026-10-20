begin;
create table public.products (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references auth.users(id),
 title text not null check(length(title) between 1 and 100), description text not null check(length(description)<=500),
 price text not null check(price ~ '^(0|[1-9][0-9]{0,8})(\.[0-9]{1,6})?$' and price::numeric>0),
 recipient text not null check(recipient ~ '^0x[0-9a-f]{40}$' and recipient <> '0x0000000000000000000000000000000000000000'),
 storage_path text not null, created_at timestamptz not null default now()
);
create table public.orders (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id),
 buyer_id uuid not null references auth.users(id), recipient text not null, amount text not null,
 status text not null default 'pending' check(status in ('pending','settling','paid')),
 payment_method text check(payment_method in ('direct','x402')), tx_hash text unique, payer text,
 payment_payload jsonb, payment_requirements jsonb, authorization_id text unique,
 created_at timestamptz not null default now(), paid_at timestamptz,
 unique(product_id,buyer_id),check((status='paid' and tx_hash is not null and payer is not null) or status<>'paid')
);
create table public.delivery_events (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id), buyer_id uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.delivery_events enable row level security;
-- No browser table grants: all operations are authenticated and checked in server routes.
revoke all on public.products,public.orders,public.delivery_events from anon,authenticated;
grant all on public.products,public.orders,public.delivery_events to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('products','products',false,10485760,array['application/pdf','application/zip','text/plain','image/png','image/jpeg']) on conflict(id) do nothing;
-- Objects are immutable uploads in the owner's folder; only the server can sign downloads.
create policy "Authenticated users upload into own folder" on storage.objects for insert to authenticated
 with check(bucket_id='products' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
