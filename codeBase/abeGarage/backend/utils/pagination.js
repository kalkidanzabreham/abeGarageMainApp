// Shared helpers for paginated, filterable list endpoints.

// page/page_size (already validated) -> SQL LIMIT/OFFSET values
const limitOffset = ({ page, page_size }) => ({ limit: page_size, offset: (page - 1) * page_size });

// Search text for `LIKE ? ESCAPE '\\'`: %, _ and \ typed by the user are
// matched literally instead of acting as wildcards.
const likePattern = (q) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const paginationMeta = ({ page, page_size }, total) => ({
  page,
  page_size,
  total,
  total_pages: Math.max(1, Math.ceil(total / page_size)),
});

// Build "WHERE a AND b" from [sql, params] pairs whose condition applies.
const whereClause = (conditions) => {
  const active = conditions.filter(Boolean);
  return {
    sql: active.length ? `WHERE ${active.map(([sql]) => `(${sql})`).join(" AND ")}` : "",
    params: active.flatMap(([, params]) => params),
  };
};

module.exports = { limitOffset, likePattern, paginationMeta, whereClause };
