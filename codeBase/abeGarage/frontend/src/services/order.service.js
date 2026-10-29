import { apiFetch, withQuery } from "./api";

// Callers still pass a token argument; it is ignored because apiFetch
// adds the stored token itself.
// params: { page, page_size, q, status, customer_id } (paginated on the server)
const getAllOrders = async (params) => {
  const response = await apiFetch(withQuery("/orders", params), { method: "GET" });
  return response.json();
};
// a function to add an order to the backend
const addOrder = async (order) => {
  const response = await apiFetch("/order", {
    method: "POST",
    body: JSON.stringify(order),
  });
  return response.json();
};
//  a function to get single order by ID
const getOrderById = async (orderId) => {
  const response = await apiFetch(`/order/${orderId}`, { method: "GET" });
  return response.json();
};
// a function to update an order
const updateOrder = async (orderId, order) => {
  const response = await apiFetch(`/order/${orderId}`, {
    method: "PUT",
    body: JSON.stringify(order),
  });
  return response.json();
};
// get order by hash (public customer tracking link: no login needed)
const getOrderByHash = async (order_hash) => {
  const response = await apiFetch(`/order/hash/${order_hash}`, {
    auth: false,
    method: "GET",
  });
  return response.json();
};
const singleCustomersOrder = async (customer_id) => {
  try {
    const response = await apiFetch(`/singleorder_per_customer/${customer_id}`, {
      method: "GET",
    });
    return response.json();
  } catch (error) {
    console.log(error);
  }
};
const singleOrder = async (order_id) => {
  try {
    const response = await apiFetch(`/singleorder/${order_id}`, { method: "GET" });
    return response.json();
  } catch (error) {
    console.log(error);
  }
};

// export the function
export { getAllOrders, addOrder, getOrderById, updateOrder, singleCustomersOrder, singleOrder, getOrderByHash };
