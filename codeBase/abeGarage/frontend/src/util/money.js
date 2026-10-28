// One place to format prices so every screen shows them the same way.
export const formatPrice = (value) =>
  value === null || value === undefined || value === ""
    ? "—"
    : `$${Number(value).toFixed(2)}`;
