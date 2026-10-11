create or replace function public.record_breeding(
  p_sow_id bigint,
  p_boar_id bigint,
  p_breed_date timestamptz,
  p_expected_farrow_date timestamptz
) returns public.breedings
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_breeding public.breedings;
begin
  perform 1 from public.sows where id = p_sow_id for update;
  if not found then
    raise exception 'sow % not found', p_sow_id using errcode = 'P0002';
  end if;

  -- A sow carries at most one pregnancy, so a repeated call returns the open one.
  select * into v_breeding from public.breedings
  where sow_id = p_sow_id and actual_farrow_date is null and coalesce(is_aborted, false) = false
  order by breed_date desc limit 1;
  if found then
    return v_breeding;
  end if;

  insert into public.breedings (sow_id, boar_id, breed_date, expected_farrow_date)
  values (p_sow_id, p_boar_id, p_breed_date, p_expected_farrow_date)
  returning * into v_breeding;

  update public.sows set is_available = false, updated_at = now() where id = p_sow_id;

  return v_breeding;
end;
$$;

create or replace function public.record_farrow(
  p_breeding_id bigint,
  p_farrow_date timestamptz,
  p_male_born_alive int,
  p_female_born_alive int,
  p_born_dead int,
  p_avg_weight numeric,
  p_is_aborted boolean
) returns public.breedings
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_breeding public.breedings;
begin
  select * into v_breeding from public.breedings where id = p_breeding_id for update;
  if not found then
    raise exception 'breeding % not found', p_breeding_id using errcode = 'P0002';
  end if;

  if v_breeding.actual_farrow_date is not null then
    return v_breeding;
  end if;

  update public.breedings set
    actual_farrow_date = p_farrow_date,
    piglets_male_born_alive = p_male_born_alive,
    piglets_female_born_alive = p_female_born_alive,
    piglets_born_dead = p_born_dead,
    piglets_born_count = p_male_born_alive + p_female_born_alive,
    avg_weight = p_avg_weight,
    is_aborted = p_is_aborted,
    updated_at = now()
  where id = p_breeding_id
  returning * into v_breeding;

  if not p_is_aborted then
    insert into public.litters (
      sow_id, birth_date, piglets_born_count,
      piglets_male_born_alive, piglets_female_born_alive, avg_weight
    ) values (
      v_breeding.sow_id, p_farrow_date, p_male_born_alive + p_female_born_alive,
      p_male_born_alive, p_female_born_alive, p_avg_weight
    );
  end if;

  update public.sows set is_available = true, updated_at = now() where id = v_breeding.sow_id;

  return v_breeding;
end;
$$;

grant execute on function public.record_breeding(bigint, bigint, timestamptz, timestamptz) to authenticated;
grant execute on function public.record_farrow(bigint, timestamptz, int, int, int, numeric, boolean) to authenticated;
