-- 적용된 프로젝트용 변경분. 새 프로젝트는 schema.sql만 실행한다.
-- 1) stores.opening_time 추가 2) 판매자 승인 제거: 예약은 생성 즉시 approved로 확정한다.
-- 이 코드와 함께 배포한다. 이전 코드는 없어진 함수를, 새 코드는 없던 컬럼을 찾으므로 어느 쪽만 적용하면 실패한다.

begin;

-- 기존 매장은 영업일 시작인 06:00으로 채워 지금 동작을 유지한다. 판매자가 /store에서 고친다.
alter table public.stores add column opening_time time not null default '06:00';
alter table public.stores alter column opening_time drop default;
-- 기존 행은 검사하지 않고 이후 저장부터 적용한다.
alter table public.stores add constraint stores_business_hours
  check (opening_time >= time '06:00' and (closing_time < time '06:00' or closing_time > opening_time)) not valid;

grant select (opening_time) on public.stores to anon;
grant insert (opening_time), update (opening_time) on public.stores to authenticated;

-- 픽업 시각이 지난 대기 예약은 재고를 돌려주고, 나머지 대기 예약은 이미 재고를 확보했으므로 확정한다.
select public.expire_overdue_reservations();
update public.reservations set status = 'approved', approved_at = created_at where status = 'pending';

alter table public.reservations alter column status set default 'approved';

drop function public.expire_overdue_reservations();

create or replace function public.create_reservation(
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

create or replace function public.change_reservation_status(p_reservation_id uuid, p_action text)
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

create or replace function public.reservation_contacts(p_reservation_ids uuid[])
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

commit;
