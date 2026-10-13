import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Litter } from "@sowcycle/core";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTH(dateString: string, d = true, m = true, y = false) {
  return new Date(dateString).toLocaleDateString("th-TH", {
    year: y ? "numeric" : undefined,
    month: m ? "long" : undefined,
    day: d ? "numeric" : undefined,
  });
}

export function getDaysDiff(dateStr: string) {
  const diffTime = new Date().getTime() - new Date(dateStr).getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getDaysRemaining(dateStr: string) {
  const diffTime = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// avg_weight holds the birth weight until the sale form overwrites it, so only sold litters carry a sale weight.
export function getSoldLitters(litters: Litter[]) {
  return litters
    .filter(
      (litter): litter is Litter & { sold_at: string; avg_weight: number } =>
        !!litter.sold_at && !!litter.avg_weight && litter.avg_weight > 0
    )
    .sort((a, b) => new Date(a.sold_at).getTime() - new Date(b.sold_at).getTime());
}
