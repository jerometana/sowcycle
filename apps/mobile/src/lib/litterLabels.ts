import type { LitterStage } from "@sowcycle/core";

export const LITTER_STAGE_LABEL: Record<LitterStage, { text: string; color: string }> = {
  nursing: { text: "เลี้ยงลูก", color: "#0284c7" },
  fattening: { text: "กำลังขุน", color: "#ea580c" },
  sold: { text: "ขายแล้ว", color: "#16a34a" },
};
