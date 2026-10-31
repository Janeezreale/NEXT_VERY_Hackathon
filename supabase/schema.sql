-- 배포용 전체 스키마.
-- 빈 Supabase 프로젝트에 한 번만 실행한다. 이미 적용된 프로젝트에 다시 실행하면 오류가 난다.
-- 스키마를 변경할 때는 이 파일을 갱신하고, 이미 적용된 프로젝트에는 변경분 SQL을 따로 실행한다.
-- 정책 근거: docs/DATA_MODEL.md, docs/DECISIONS.md. 미정 정책은 가장 좁은 권한으로 두고 확정 시 넓힌다.

create type public.user_role as enum ('consumer', 'seller');
create type public.freshness_level as enum ('fresh', 'sell_today', 'discard_tomorrow');
-- pending은 승인 제도를 없애며 쓰지 않는다. rejected·expired는 과거 예약 이력에만 남는다.
create type public.reservation_status as enum ('pending', 'approved', 'rejected', 'cancelled', 'completed', 'expired', 'no_show');

-- 테이블

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'consumer',
  region_code text
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  region_code text not null,
  address text not null,
  opening_time time not null,
  closing_time time not null,
  latitude double precision,
  longitude double precision,
  constraint stores_latitude_range check (latitude between -90 and 90),
  constraint stores_longitude_range check (longitude between -180 and 180),
  constraint stores_coordinates_pair check ((latitude is null) = (longitude is null)),
  -- 영업일은 오전 6시에 시작한다. 06:00 이전 마감은 다음 날 새벽이다.
  constraint stores_business_hours check (opening_time >= time '06:00' and (closing_time < time '06:00' or closing_time > opening_time))
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  unit text not null,
  available_quantity integer not null check (available_quantity >= 0),
  base_price integer not null,
  min_price integer not null check (min_price > 0),
  freshness public.freshness_level not null,
  sale_ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint products_min_price_lte_base_price check (min_price <= base_price)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null unique
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  consumer_id uuid not null references public.profiles (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  confirmed_unit_price integer not null check (confirmed_unit_price > 0),
  total_price integer not null,
  pickup_at timestamptz not null,
  status public.reservation_status not null default 'approved',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  idempotency_key uuid not null,
  cancelled_by public.user_role,
  contact_name text not null check (length(trim(contact_name)) > 0),
  contact_phone text not null check (contact_phone ~ '^01[0-9]{8,9}$'),
  constraint reservations_consumer_idempotency_key unique (consumer_id, idempotency_key),
  constraint reservations_total_price_matches check (total_price = quantity * confirmed_unit_price),
  constraint reservations_approved_at_required check (status not in ('approved', 'completed') or approved_at is not null)
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations (id) on delete restrict,
  final_amount integer not null check (final_amount > 0),
  completed_at timestamptz not null default now()
);

-- 인덱스

create index stores_region_code_idx on public.stores (region_code);
create index products_store_id_idx on public.products (store_id);
create index products_sale_ends_at_idx on public.products (sale_ends_at);
create index product_images_product_id_idx on public.product_images (product_id);
create index reservations_product_status_idx on public.reservations (product_id, status, approved_at);
create index reservations_consumer_created_idx on public.reservations (consumer_id, created_at desc);
create index sales_completed_at_idx on public.sales (completed_at);

-- 가입 시 프로필 생성. 메타데이터 role이 정확히 'seller'일 때만 seller, 그 외는 consumer로 저장한다.
-- 사장님 여부는 본인 선택이며 사업자 확인은 하지 않는다. 가입 후 역할 변경은 차단된다.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'role' = 'seller' then 'seller'::public.user_role
      else 'consumer'::public.user_role
    end
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- 가격 계산용 최근 60분 확정 수량. 예약은 생성 즉시 확정되므로 approved_at이 예약 시각이다. 소비자가 다른 사람의 예약을 읽지 않도록 합계만 돌려준다.
-- 취소된 수량은 제외한다(D02). 구간은 src/lib/pricing/config.ts와 같아야 한다.
create function public.recent_approved_quantities(product_ids uuid[])
returns table (product_id uuid, quantity bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select reservations.product_id, sum(reservations.quantity)
  from public.reservations
  where reservations.product_id = any (product_ids)
    and reservations.status in ('approved', 'completed')
    and reservations.approved_at >= now() - interval '60 minutes'
  group by reservations.product_id;
$$;

revoke all on function public.recent_approved_quantities(uuid[]) from public, anon, authenticated;
grant execute on function public.recent_approved_quantities(uuid[]) to anon, authenticated;

-- 예약 함수. 잠금 순서는 언제나 products → reservations다.
-- 오류는 메시지에 API 오류 코드를 담아 서버가 변환한다.

-- 예약은 가게 마감 30분 전까지 받는다. 영업일은 오전 6시에 바뀌고, 06:00 이전 마감은 다음 날 새벽이다.
-- 값은 src/lib/pricing/config.ts와 같아야 한다.
create function public.reservation_deadline(sale_ends_at timestamptz, closing_time time)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select least(
    sale_ends_at,
    (
      ((now() at time zone 'Asia/Seoul' - interval '6 hours')::date + closing_time
        + case when closing_time < time '06:00' then interval '1 day' else interval '0' end)
      at time zone 'Asia/Seoul'
    ) - interval '30 minutes'
  );
$$;

-- 확정 가격을 인자로 받으므로 서버 전용이다. 브라우저 권한으로 열면 가격을 조작할 수 있다.
create function public.create_reservation(
  p_consumer_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_pickup_at timestamptz,
  p_idempotency_key uuid,
  p_unit_price integer,
  p_contact_name text,
  p_contact_phone text
)
returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products;
  v_opening time;
  v_closing time;
  v_deadline timestamptz;
  v_reservation public.reservations;
begin
  select * into v_reservation from public.reservations
  where consumer_id = p_consumer_id and idempotency_key = p_idempotency_key;
  if found then
    return v_reservation;
  end if;

  if not exists (select 1 from public.profiles where id = p_consumer_id and role = 'consumer') then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;

  select opening_time, closing_time into v_opening, v_closing from public.stores where id = v_product.store_id;
  if now() < (((now() at time zone 'Asia/Seoul' - interval '6 hours')::date + v_opening) at time zone 'Asia/Seoul') then
    raise exception 'STORE_CLOSED';
  end if;
  v_deadline := public.reservation_deadline(v_product.sale_ends_at, v_closing);
  if now() >= v_deadline then
    raise exception 'SALE_ENDED';
  end if;
  if p_pickup_at <= now() or p_pickup_at > v_deadline then
    raise exception 'VALIDATION_ERROR';
  end if;
  if v_product.available_quantity < p_quantity then
    raise exception 'OUT_OF_STOCK';
  end if;

  update public.products
  set available_quantity = available_quantity - p_quantity
  where id = p_product_id;

  insert into public.reservations
    (product_id, consumer_id, quantity, confirmed_unit_price, total_price, pickup_at, status, approved_at, idempotency_key, contact_name, contact_phone)
  values
    (p_product_id, p_consumer_id, p_quantity, p_unit_price, p_quantity * p_unit_price, p_pickup_at, 'approved', now(), p_idempotency_key, p_contact_name, p_contact_phone)
  returning * into v_reservation;
  return v_reservation;
exception
  when unique_violation then
    select * into strict v_reservation from public.reservations
    where consumer_id = p_consumer_id and idempotency_key = p_idempotency_key;
    return v_reservation;
end;
$$;

create function public.change_reservation_status(p_reservation_id uuid, p_action text)
returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_product_id uuid;
  v_reservation public.reservations;
  v_is_owner boolean;
  v_return_stock boolean := false;
begin
  if v_uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select product_id into v_product_id from public.reservations where id = p_reservation_id;
  if not found then
    raise exception 'NOT_FOUND';
  end if;

  perform 1 from public.products where id = v_product_id for update;
  select * into strict v_reservation from public.reservations where id = p_reservation_id for update;

  select stores.owner_id = v_uid into v_is_owner
  from public.products join public.stores on stores.id = products.store_id
  where products.id = v_product_id;

  if p_action = 'cancel' then
    if v_reservation.consumer_id <> v_uid then
      raise exception 'FORBIDDEN';
    end if;
    if v_reservation.status <> 'approved' then
      raise exception 'INVALID_TRANSITION';
    end if;
    update public.reservations set status = 'cancelled', cancelled_by = 'consumer'
    where id = p_reservation_id returning * into v_reservation;
    v_return_stock := true;
  elsif p_action in ('seller_cancel', 'no_show', 'complete') then
    if not v_is_owner then
      raise exception 'FORBIDDEN';
    end if;

    if p_action = 'seller_cancel' and v_reservation.status = 'approved' then
      update public.reservations set status = 'cancelled', cancelled_by = 'seller'
      where id = p_reservation_id returning * into v_reservation;
      v_return_stock := true;
    elsif p_action = 'no_show' and v_reservation.status = 'approved' and v_reservation.pickup_at <= now() then
      update public.reservations set status = 'no_show'
      where id = p_reservation_id returning * into v_reservation;
      v_return_stock := true;
    elsif p_action = 'complete' and v_reservation.status = 'approved' then
      update public.reservations set status = 'completed'
      where id = p_reservation_id returning * into v_reservation;
      insert into public.sales (reservation_id, final_amount)
      values (p_reservation_id, v_reservation.total_price);
    else
      raise exception 'INVALID_TRANSITION';
    end if;
  else
    raise exception 'VALIDATION_ERROR';
  end if;

  if v_return_stock then
    update public.products
    set available_quantity = available_quantity + v_reservation.quantity
    where id = v_product_id;
  end if;
  return v_reservation;
end;
$$;

revoke all on function public.reservation_deadline(timestamptz, time) from public, anon, authenticated;
revoke all on function public.create_reservation(uuid, uuid, integer, timestamptz, uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.change_reservation_status(uuid, text) from public, anon;
grant execute on function public.create_reservation(uuid, uuid, integer, timestamptz, uuid, integer, text, text) to service_role;
grant execute on function public.change_reservation_status(uuid, text) to authenticated;

-- 재고는 판매자가 화면에서 본 값과 같을 때만 바꾼다. 그 사이 들어온 예약의 확보 수량을 덮어쓰지 않기 위해서다.
create function public.update_product(
  p_product_id uuid,
  p_name text,
  p_unit text,
  p_quantity integer,
  p_expected_quantity integer,
  p_base_price integer,
  p_min_price integer,
  p_freshness public.freshness_level,
  p_sale_ends_at timestamptz
)
returns public.products
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products;
begin
  select * into v_product from public.products where id = p_product_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if not exists (select 1 from public.stores where id = v_product.store_id and owner_id = auth.uid()) then
    raise exception 'FORBIDDEN';
  end if;
  if v_product.available_quantity <> p_expected_quantity then
    raise exception 'STOCK_CHANGED';
  end if;

  update public.products
  set name = p_name, unit = p_unit, available_quantity = p_quantity,
      base_price = p_base_price, min_price = p_min_price,
      freshness = p_freshness, sale_ends_at = p_sale_ends_at
  where id = p_product_id
  returning * into v_product;
  return v_product;
end;
$$;

-- 예약 이력이 있는 상품은 남긴다. 판매 기록과 소비자 내역이 상품을 참조한다.
create function public.delete_product(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
begin
  select store_id into v_store_id from public.products where id = p_product_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if not exists (select 1 from public.stores where id = v_store_id and owner_id = auth.uid()) then
    raise exception 'FORBIDDEN';
  end if;
  if exists (select 1 from public.reservations where product_id = p_product_id) then
    raise exception 'PRODUCT_HAS_RESERVATIONS';
  end if;
  delete from public.products where id = p_product_id;
end;
$$;

revoke all on function public.update_product(uuid, text, text, integer, integer, integer, integer, public.freshness_level, timestamptz) from public, anon;
revoke all on function public.delete_product(uuid) from public, anon;
grant execute on function public.update_product(uuid, text, text, integer, integer, integer, integer, public.freshness_level, timestamptz) to authenticated;
grant execute on function public.delete_product(uuid) to authenticated;

-- 연락처는 직접 조회할 수 없다. 판매자는 본인 매장의 진행 중 예약만 이 함수로 읽는다.
create function public.reservation_contacts(p_reservation_ids uuid[])
returns table (reservation_id uuid, contact_name text, contact_phone text)
language sql
stable
security definer
set search_path = ''
as $$
  select reservations.id, reservations.contact_name, reservations.contact_phone
  from public.reservations
  join public.products on products.id = reservations.product_id
  join public.stores on stores.id = products.store_id
  where reservations.id = any (p_reservation_ids)
    and reservations.status = 'approved'
    and stores.owner_id = auth.uid();
$$;

revoke all on function public.reservation_contacts(uuid[]) from public, anon;
grant execute on function public.reservation_contacts(uuid[]) to authenticated;

-- 상품 사진. 형식과 크기는 버킷이 제한하고, 파일은 본인 매장 폴더에만 올린다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy product_images_upload_owner on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.stores
      where stores.owner_id = (select auth.uid())
        and stores.id::text = (storage.foldername(objects.name))[1]
    )
  );

-- 판매자는 본인 매장 폴더의 파일을 지울 수 있다. Storage 삭제는 대상 조회 권한도 필요하다.
create policy product_images_read_owner on storage.objects
  for select to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.stores
      where stores.owner_id = (select auth.uid())
        and stores.id::text = (storage.foldername(objects.name))[1]
    )
  );

create policy product_images_remove_owner on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.stores
      where stores.owner_id = (select auth.uid())
        and stores.id::text = (storage.foldername(objects.name))[1]
    )
  );

-- 권한: Supabase 기본 권한을 제거하고 필요한 컬럼만 허용한다.
-- reservations·sales 쓰기와 products 수정은 허용하지 않는다(L05 함수, D08).

revoke all on public.profiles, public.stores, public.products, public.product_images, public.reservations, public.sales
  from anon, authenticated;

grant select on public.profiles, public.stores, public.products, public.product_images, public.sales
  to authenticated;
grant select (id, product_id, consumer_id, quantity, confirmed_unit_price, total_price, pickup_at, status, approved_at, created_at, idempotency_key, cancelled_by)
  on public.reservations to authenticated;
grant select (id, name, region_code, address, opening_time, closing_time, latitude, longitude) on public.stores to anon;
grant select on public.products, public.product_images to anon;
grant update (region_code) on public.profiles to authenticated;
grant insert (owner_id, name, region_code, address, opening_time, closing_time, latitude, longitude) on public.stores to authenticated;
grant update (name, region_code, address, opening_time, closing_time, latitude, longitude) on public.stores to authenticated;
grant insert (store_id, name, unit, available_quantity, base_price, min_price, freshness, sale_ends_at)
  on public.products to authenticated;
grant insert (product_id, storage_path), delete on public.product_images to authenticated;

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.reservations enable row level security;
alter table public.sales enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy stores_select_public on public.stores
  for select to anon, authenticated
  using (true);

create policy stores_insert_seller on public.stores
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'seller'
    )
  );

create policy stores_update_owner on public.stores
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy products_select_public on public.products
  for select to anon, authenticated
  using (true);

create policy products_insert_owner on public.products
  for insert to authenticated
  with check (
    exists (
      select 1 from public.stores
      where stores.id = products.store_id and stores.owner_id = (select auth.uid())
    )
  );

create policy product_images_select_public on public.product_images
  for select to anon, authenticated
  using (true);

create policy product_images_insert_owner on public.product_images
  for insert to authenticated
  with check (
    exists (
      select 1 from public.products
      join public.stores on stores.id = products.store_id
      where products.id = product_images.product_id and stores.owner_id = (select auth.uid())
    )
  );

create policy product_images_delete_owner on public.product_images
  for delete to authenticated
  using (
    exists (
      select 1 from public.products
      join public.stores on stores.id = products.store_id
      where products.id = product_images.product_id and stores.owner_id = (select auth.uid())
    )
  );

create policy reservations_select_participant on public.reservations
  for select to authenticated
  using (
    consumer_id = (select auth.uid())
    or exists (
      select 1 from public.products
      join public.stores on stores.id = products.store_id
      where products.id = reservations.product_id and stores.owner_id = (select auth.uid())
    )
  );

create policy sales_select_owner on public.sales
  for select to authenticated
  using (
    exists (
      select 1 from public.reservations
      join public.products on products.id = reservations.product_id
      join public.stores on stores.id = products.store_id
      where reservations.id = sales.reservation_id and stores.owner_id = (select auth.uid())
    )
  );
