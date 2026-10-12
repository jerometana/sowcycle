export const thaiDate = (date: Date | string, withYear = false) =>
  new Date(date).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: withYear ? "numeric" : undefined,
  });
