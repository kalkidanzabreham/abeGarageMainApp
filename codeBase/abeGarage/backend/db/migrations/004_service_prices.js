// Order totals are computed on the server from catalog prices, so the
// catalog needs a price. DECIMAL avoids float rounding on money, and the
// order total moves from INT (whole units only) to the same type.
exports.up = async (knex) => {
  await knex.schema.alterTable("common_services", (t) => {
    t.decimal("service_price", 10, 2).notNullable().defaultTo(0);
  });
  await knex.schema.alterTable("order_info", (t) => {
    t.decimal("order_total_price", 10, 2).notNullable().defaultTo(0).alter();
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable("order_info", (t) => {
    t.integer("order_total_price").notNullable().alter();
  });
  await knex.schema.alterTable("common_services", (t) => {
    t.dropColumn("service_price");
  });
};
