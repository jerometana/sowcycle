import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  UpdateType,
} from "@powersync/react-native";
import { supabase } from "../lib/supabase";

export const connector: PowerSyncBackendConnector = {
  async fetchCredentials() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    return {
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL!,
      token: data.session.access_token,
    };
  },

  async uploadData(db: AbstractPowerSyncDatabase) {
    const tx = await db.getNextCrudTransaction();
    if (!tx) return;
    for (const op of tx.crud) {
      // Server ids are bigint until the UUID migration lands, so a PATCH on a row created offline cannot be matched yet.
      const table = supabase.from(op.table);
      const { error } =
        op.op === UpdateType.PUT
          ? await table.insert(op.opData!)
          : op.op === UpdateType.PATCH
            ? await table.update(op.opData!).eq("id", Number(op.id))
            : await table.delete().eq("id", Number(op.id));
      if (error) throw error;
    }
    await tx.complete();
  },
};
