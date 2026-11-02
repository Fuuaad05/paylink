begin;
create table public.payment_authorizations (
 id text primary key, kind text not null check(kind in ('product','creator_plan')), order_id uuid not null,
 created_at timestamptz not null default now()
);
create table public.payment_receipts (like public.payment_authorizations including all);
insert into public.payment_authorizations(id,kind,order_id) select authorization_id,'product',id from public.orders where authorization_id is not null on conflict do nothing;
insert into public.payment_receipts(id,kind,order_id) select lower(tx_hash),'product',id from public.orders where tx_hash is not null on conflict do nothing;
create table public.creator_plans (
 seller_id uuid primary key references auth.users(id), expires_at timestamptz not null
);
create table public.creator_plan_orders (
 id uuid primary key default gen_random_uuid(), buyer_id uuid not null references auth.users(id), recipient text not null,
 amount text not null check(amount='3'), status text not null default 'pending' check(status in ('pending','settling','paid')),
 payer text, tx_hash text unique, authorization_id text unique, payment_payload jsonb, payment_requirements jsonb,
 created_at timestamptz not null default now(), paid_at timestamptz, granted_until timestamptz
);
create unique index creator_plan_one_open_order on public.creator_plan_orders(buyer_id) where status<>'paid';
alter table public.payment_authorizations enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.creator_plans enable row level security;
alter table public.creator_plan_orders enable row level security;
revoke all on public.payment_authorizations,public.payment_receipts,public.creator_plans,public.creator_plan_orders from anon,authenticated;
grant all on public.payment_authorizations,public.payment_receipts,public.creator_plans,public.creator_plan_orders to service_role;

create function public.enforce_creator_product_limit() returns trigger language plpgsql security definer set search_path='' as $$
declare cap integer; current_count integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.seller_id::text,0));
 select case when exists(select 1 from public.creator_plans where seller_id=new.seller_id and expires_at>now()) then 25 else 3 end into cap;
 select count(*) into current_count from public.products where seller_id=new.seller_id;
 if current_count>=cap then raise exception 'CREATOR_PRODUCT_LIMIT: Upgrade your Creator plan before publishing another product.'; end if;
 return new;
end; $$;
create trigger creator_product_limit before insert on public.products for each row execute function public.enforce_creator_product_limit();
revoke all on function public.enforce_creator_product_limit() from public;

-- The service calls this only after verifying the MUSD transfer on chain.
-- Locking the order makes retries extend entitlement exactly once.
create function public.activate_creator_plan(p_order_id uuid) returns timestamptz language plpgsql security definer set search_path='' as $$
declare purchase public.creator_plan_orders; expiry timestamptz;
begin
 select * into purchase from public.creator_plan_orders where id=p_order_id for update;
 if not found then raise exception 'Plan order not found'; end if;
 if purchase.status='paid' then return purchase.granted_until; end if;
 if purchase.status<>'settling' or purchase.tx_hash is null or purchase.payer is null then raise exception 'Plan payment not verified'; end if;
 if not exists(select 1 from public.payment_receipts where id=lower(purchase.tx_hash) and kind='creator_plan' and order_id=purchase.id) then raise exception 'Receipt not claimed'; end if;
 insert into public.creator_plans(seller_id,expires_at) values(purchase.buyer_id,now()) on conflict do nothing;
 select greatest(expires_at,now())+interval '30 days' into expiry from public.creator_plans where seller_id=purchase.buyer_id for update;
 update public.creator_plans set expires_at=expiry where seller_id=purchase.buyer_id;
 update public.creator_plan_orders set status='paid',paid_at=now(),granted_until=expiry where id=purchase.id;
 return expiry;
end; $$;
revoke all on function public.activate_creator_plan(uuid) from public,anon,authenticated;
grant execute on function public.activate_creator_plan(uuid) to service_role;
commit;
