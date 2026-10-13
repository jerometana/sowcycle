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

export const THAI_WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

// "อ. 13 ตุลาคม". Built by hand because Android's Thai locale spells out the weekday even when asked for the short form.
export const thaiWeekdayDate = (date: Date) => `${THAI_WEEKDAYS[date.getDay()]} ${thaiDateLong(date)}`;
