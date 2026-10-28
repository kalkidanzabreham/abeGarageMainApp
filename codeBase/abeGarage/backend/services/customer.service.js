// import db connection
const query = require("../config/db.config");
const { withTransaction } = require("../config/db.config");
const { v4: uuidv4 } = require("uuid");
const checkIfCustomerExists = async (email) => {
  const checkEmail =
    "SELECT * FROM customer_identifier WHERE customer_email = ?";
  const rows = await query(checkEmail, [email]);
  if (rows.length > 0) {
    return true;
  }
  return false;
};

const addCustomer = async (customer) => {
  let returnDatas = {};
  // both rows or neither: no orphaned customer_identifier on failure
  returnDatas = await withTransaction(async (txQuery) => {
    // customer_hash is NOT NULL with no default; it was never set, so every
    // insert failed in MySQL strict mode (ER 1364). Same scheme as order_hash.
    const quary1 =
      "INSERT INTO customer_identifier(customer_email,customer_phone_number,customer_hash) VALUES(?,?,?)";
    const row1 = await txQuery(quary1, [
      customer.customer_email,
      customer.customer_phone_number,
      uuidv4(),
    ]);
    const customer_id = row1.insertId;

    const quary2 =
      "INSERT INTO customer_info(customer_id,customer_first_name,customer_last_name,active_customer_status) VALUES(?,?,?,?)";
    await txQuery(quary2, [
      customer_id,
      customer.customer_first_name,
      customer.customer_last_name,
      customer.active_customer_status,
    ]);
    return { customer_id: customer_id };
  });

  return returnDatas;
};
const getAllCustomers = async () => {
  // selelct all customers fro those two tables

  const allCustomers =
    "SELECT * FROM customer_identifier INNER JOIN customer_info  ON customer_identifier.customer_id = customer_info.customer_id ORDER BY customer_identifier.customer_id DESC";
  const rows = await query(allCustomers);
  return rows;
};
const getSingleCustomer = async (id) => {
  const singleCustomer =
    "SELECT * FROM customer_identifier INNER JOIN customer_info  ON customer_identifier.customer_id = customer_info.customer_id WHERE customer_identifier.customer_id =? ";
  const rows = await query(singleCustomer, [id]);
  return rows;
};

const editCustomer = async (customer_id, customer) => {
  const querys = `
    UPDATE customer_info 
    INNER JOIN customer_identifier 
    ON customer_info.customer_id = customer_identifier.customer_id 
    SET 
      customer_info.customer_first_name = ?, 
      customer_info.customer_last_name = ?, 
      customer_info.active_customer_status = ?, 
      customer_identifier.customer_phone_number = ? 
    WHERE customer_info.customer_id = ?;
  `;

  const rows = await query(querys, [
    customer.customer_first_name,
    customer.customer_last_name,
    customer.active_customer_status,
    customer.customer_phone_number,
    customer_id,
  ]);

  return rows;
};

module.exports = {
  checkIfCustomerExists,
  addCustomer,
  getAllCustomers,
  getSingleCustomer,
  editCustomer,
};
