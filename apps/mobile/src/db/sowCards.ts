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

const SOW_CARDS = `
  select s.id, s.name, s.is_active,
    ob.id as open_breeding_id, ob.expected_farrow_date,
    (select max(actual_farrow_date) from breedings f
      where f.sow_id = s.id and f.actual_farrow_date is not null and coalesce(f.is_aborted, 0) = 0) as last_farrow_date,
    (select bo.breed from breedings lb join boars bo on bo.id = lb.boar_id
      where lb.sow_id = s.id order by lb.breed_date desc limit 1) as breed
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
