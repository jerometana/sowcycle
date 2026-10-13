import { useQuery } from "@powersync/react-native";

type SowCardRow = {
  id: string;
  name: string;
  is_active: number | null;
  open_breeding_id: string | null;
  expected_farrow_date: string | null;
  last_farrow_date: string | null;
  breed: string | null;
};

export type SowCardData = {
  id: string;
  name: string;
  active: boolean;
  breed: string | null;
  pregnancy: { breedingId: string; expectedFarrow: string } | null;
  lastFarrow: string | null;
};

// The sow's own breeds, as the web shows them; `s` must name the sows row.
export const SOW_BREEDS = `(select group_concat(breed, ', ') from (
    select bo.breed from sow_breeds sb join boars bo on bo.id = sb.breed_id where sb.sow_id = s.id order by bo.breed))`;

const SOW_CARDS = `
  select s.id, s.name, s.is_active,
    ob.id as open_breeding_id, ob.expected_farrow_date,
    (select max(actual_farrow_date) from breedings f
      where f.sow_id = s.id and f.actual_farrow_date is not null and coalesce(f.is_aborted, 0) = 0) as last_farrow_date,
    ${SOW_BREEDS} as breed
  from sows s
  left join breedings ob on ob.id = (
    select id from breedings where sow_id = s.id and actual_farrow_date is null and coalesce(is_aborted, 0) = 0
    order by breed_date desc limit 1
  )
  order by s.name`;

const toCard = (r: SowCardRow): SowCardData => ({
  id: r.id,
  name: r.name,
  active: r.is_active !== 0,
  breed: r.breed,
  pregnancy:
    r.open_breeding_id && r.expected_farrow_date
      ? { breedingId: r.open_breeding_id, expectedFarrow: r.expected_farrow_date }
      : null,
  lastFarrow: r.last_farrow_date,
});

export const useSowCards = () => {
  const { data, isLoading } = useQuery<SowCardRow>(SOW_CARDS);
  return { sows: data.map(toCard), isLoading };
};
