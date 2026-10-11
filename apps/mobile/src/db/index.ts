import "@azure/core-asynciterator-polyfill";
import { PowerSyncDatabase } from "@powersync/react-native";
import { AppSchema } from "./schema";

export const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: { dbFilename: "sowcycle.db" },
});
