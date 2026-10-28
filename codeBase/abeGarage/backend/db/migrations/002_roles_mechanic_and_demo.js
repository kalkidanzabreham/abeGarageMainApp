// "Employee" becomes "Mechanic" (same id, so existing employees keep their
// role), and a read-only "Demo" role is added. Ids match config/roles.js.
exports.up = async (knex) => {
  await knex("company_roles")
    .where({ company_role_id: 1 })
    .update({ company_role_name: "Mechanic" });
  await knex.raw(
    "INSERT IGNORE INTO company_roles (company_role_id, company_role_name) VALUES (4, 'Demo')"
  );
};

exports.down = async (knex) => {
  // fails (FK) if any employee still has the Demo role, which is intended
  await knex("company_roles").where({ company_role_id: 4 }).del();
  await knex("company_roles")
    .where({ company_role_id: 1 })
    .update({ company_role_name: "Employee" });
};
