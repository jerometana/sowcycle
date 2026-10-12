import { column, Schema, Table } from "@powersync/react-native";

export const AppSchema = new Schema({
  sows: new Table({
    name: column.text,
    birth_date: column.text,
    add_date: column.text,
    is_available: column.integer,
    is_active: column.integer,
    breasts_count: column.integer,
  }),
  boars: new Table({
    breed: column.text,
    description: column.text,
  }),
  breedings: new Table(
    {
      sow_id: column.text,
      boar_id: column.text,
      breed_date: column.text,
      expected_farrow_date: column.text,
      actual_farrow_date: column.text,
      piglets_born_count: column.integer,
      piglets_male_born_alive: column.integer,
      piglets_female_born_alive: column.integer,
      piglets_born_dead: column.integer,
      avg_weight: column.real,
      is_aborted: column.integer,
      updated_at: column.text,
    },
    { indexes: { sow: ["sow_id", "breed_date"] } }
  ),
  litters: new Table(
    {
      sow_id: column.text,
      boar_id: column.text,
      birth_date: column.text,
      piglets_born_count: column.integer,
      piglets_male_born_alive: column.integer,
      piglets_female_born_alive: column.integer,
      avg_weight: column.real,
      fattening_at: column.text,
      saleable_at: column.text,
      sold_at: column.text,
      updated_at: column.text,
    },
    { indexes: { sow: ["sow_id"] } }
  ),
});

export type Database = (typeof AppSchema)["types"];
