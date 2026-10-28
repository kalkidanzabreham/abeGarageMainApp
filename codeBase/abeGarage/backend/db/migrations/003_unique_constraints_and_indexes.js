// Constraints the baseline schema was missing.
// - order_hash / customer_hash: looked up by value (customer tracking link),
//   so they need an index, and they must never collide.
// - order_services(order_id, service_id): a service appears once per order.
// - The *_info / *_pass / *_role / order_status tables are 1:1 with their
//   parent; UNIQUE on the FK column enforces that (the app reads row [0]).
// Note: this fails if existing data already violates a constraint; fix the
// duplicates first in that case.

const ONE_TO_ONE = [
  ["customer_info", "customer_id"],
  ["employee_info", "employee_id"],
  ["employee_pass", "employee_id"],
  ["employee_role", "employee_id"],
  ["order_info", "order_id"],
  ["order_status", "order_id"],
];

// down() re-adds plain FK indexes; drop them on the way back up so a
// rollback/migrate cycle does not leave duplicate indexes behind
const indexExists = async (knex, table, indexName) => {
  const [rows] = await knex.raw(`SHOW INDEX FROM ?? WHERE Key_name = ?`, [
    table,
    indexName,
  ]);
  return rows.length > 0;
};
const dropIndexIfExists = async (knex, table, indexName) => {
  if (await indexExists(knex, table, indexName)) {
    await knex.schema.alterTable(table, (t) => t.dropIndex([], indexName));
  }
};
const addIndexIfMissing = async (knex, table, columns, indexName) => {
  if (!(await indexExists(knex, table, indexName))) {
    await knex.schema.alterTable(table, (t) => t.index(columns, indexName));
  }
};

exports.up = async (knex) => {
  await knex.schema.alterTable("orders", (t) => {
    t.unique(["order_hash"], { indexName: "uq_orders_order_hash" });
  });
  await knex.schema.alterTable("customer_identifier", (t) => {
    t.unique(["customer_hash"], { indexName: "uq_customer_hash" });
  });
  await knex.schema.alterTable("order_services", (t) => {
    t.unique(["order_id", "service_id"], { indexName: "uq_order_service" });
  });
  await dropIndexIfExists(knex, "order_services", "idx_order_services_order_id");
  for (const [table, column] of ONE_TO_ONE) {
    await knex.schema.alterTable(table, (t) => {
      t.unique([column], { indexName: `uq_${table}_${column}` });
    });
    await dropIndexIfExists(knex, table, `idx_${table}_${column}`);
  }
};

exports.down = async (knex) => {
  // MySQL drops a foreign key's implicit index once another index can serve
  // it, so a plain index is re-added before each unique index is dropped.
  for (const [table, column] of ONE_TO_ONE) {
    await addIndexIfMissing(knex, table, [column], `idx_${table}_${column}`);
    await knex.schema.alterTable(table, (t) => {
      t.dropUnique([column], `uq_${table}_${column}`);
    });
  }
  await addIndexIfMissing(knex, "order_services", ["order_id"], "idx_order_services_order_id");
  await knex.schema.alterTable("order_services", (t) => {
    t.dropUnique(["order_id", "service_id"], "uq_order_service");
  });
  await knex.schema.alterTable("customer_identifier", (t) => {
    t.dropUnique(["customer_hash"], "uq_customer_hash");
  });
  await knex.schema.alterTable("orders", (t) => {
    t.dropUnique(["order_hash"], "uq_orders_order_hash");
  });
};
