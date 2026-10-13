export const thaiDate = (date: Date | string, withYear = false) =>
  new Date(date).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: withYear ? "numeric" : undefined,
  });

export const thaiMonthYear = (date: Date | string) =>
  new Date(date).toLocaleDateString("th-TH", { month: "short", year: "2-digit" });

// Matches the web's formatDateTH: long Thai month, year optional.
export const thaiDateLong = (date: Date | string, withYear = false) =>
  new Date(date).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: withYear ? "numeric" : undefined,
  });
