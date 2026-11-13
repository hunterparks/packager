// Delivery dates are stored as local calendar dates in "YYYY-MM-DD" form
// (the value format of <input type="date">), so they're compared as strings.

/** Today's local date as "YYYY-MM-DD". */
export function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** "2026-11-13" → "Nov 13". Built from parts so it isn't shifted by time zone. */
export function formatShortDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** @returns {"today" | "overdue" | "upcoming"} */
export function deliveryStatus(iso) {
  const today = todayISO();
  if (iso === today) return "today";
  if (iso < today) return "overdue";
  return "upcoming";
}
