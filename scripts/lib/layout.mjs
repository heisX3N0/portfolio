// Layout rules for the browser checks. Pure functions of measurements so tests can feed them bad input.

/** Number of visual rows: an item starts a new row when it doesn't overlap the current row vertically. */
export function rowCount(rects) {
  const rows = [];
  for (const r of [...rects].sort((a, b) => a.top - b.top)) {
    const row = rows.at(-1);
    if (row && r.top < row.bottom) row.bottom = Math.max(row.bottom, r.bottom);
    else rows.push({ ...r });
  }
  return rows.length;
}

/** Names of the elements that are missing or not wholly inside the first screen. */
export function outsideFirstScreen(items, viewportHeight) {
  return Object.entries(items)
    .filter(([, r]) => !r || r.top < 0 || r.bottom > viewportHeight)
    .map(([name]) => name);
}

/** Pages over the SPEC 9.4 page weight budget (200 KB total transfer). */
export function overBudget(bytesByPage, limit = 200_000) {
  return Object.entries(bytesByPage)
    .filter(([, bytes]) => bytes > limit)
    .map(([path, bytes]) => `${path}: ${bytes} bytes`);
}
