// One row per smart-intake request: outcome, reason code, repairs, timing.
// Used to count failures/repairs and to enforce the daily cap. The
// complaint text is NOT stored (it can contain customer details).
exports.up = (knex) =>
  knex.schema.createTable("ai_intake_log", (t) => {
    t.increments("id");
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.integer("employee_id").nullable().references("employee_id").inTable("employee").onDelete("SET NULL");
    t.string("provider", 40).notNullable();
    t.string("model", 100).nullable();
    t.string("prompt_version", 40).nullable();
    t.string("outcome", 20).notNullable(); // ok_strict | ok_repaired | ok_retry | failed
    t.string("reason_code", 40).nullable(); // why it failed
    t.string("repairs", 500).nullable(); // comma-separated repair codes
    t.tinyint("attempts").notNullable();
    t.integer("latency_ms").notNullable();
    t.integer("input_chars").notNullable();
    t.boolean("truncated").notNullable();
    t.integer("dropped_services").notNullable().defaultTo(0);
    t.integer("dropped_systems").notNullable().defaultTo(0);
    t.index(["created_at"]);
  });

exports.down = (knex) => knex.schema.dropTable("ai_intake_log");
