// The edit-order page used to store 3 for "completed" while every other
// screen (and the seed) uses 2. Convert stored 3s to 2 so there is one
// value per status. The converted order ids are kept in a small table so
// down() can restore exactly those rows, not every completed order.
exports.up = async (knex) => {
  await knex.schema.createTable("migration_005_status_3_orders", (t) => {
    t.integer("order_id").primary();
  });
  await knex.raw(
    `INSERT INTO migration_005_status_3_orders (order_id)
     SELECT order_id FROM order_status WHERE order_status = 3`
  );
  await knex("order_status").where({ order_status: 3 }).update({ order_status: 2 });
};

exports.down = async (knex) => {
  await knex.raw(
    `UPDATE order_status SET order_status = 3
     WHERE order_id IN (SELECT order_id FROM migration_005_status_3_orders)`
  );
  await knex.schema.dropTable("migration_005_status_3_orders");
};
